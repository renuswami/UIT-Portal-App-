import { salesforceApi } from '../../api/salesforce.api';
import { ProjectItem, ProjectStatus, TaskPriority } from './types';

class ProjectService {
    /**
     * Map Salesforce Status to ProjectStatus type
     */
    private mapStatus(status: string): ProjectStatus {
        if (status === 'Planning' || status === 'In Progress' || status === 'On Hold' || status === 'Completed' || status === 'Cancelled') {
            return status as ProjectStatus;
        }
        return '--None--';
    }

    /**
     * Map Salesforce Priority to TaskPriority type
     */
    private mapPriority(priority: string): TaskPriority {
        if (priority === 'Low' || priority === 'Medium' || priority === 'High') {
            return priority as TaskPriority;
        }
        return 'Medium';
    }

    /**
     * Fetch all projects and tasks and build a hierarchical tree
     */
    async fetchProjectsHierarchy(): Promise<ProjectItem[]> {
        const [projectsData, tasksData] = await Promise.all([
            this.getProjects(),
            this.getAllTasks()
        ]);

        console.log(`[ProjectService] Fetched ${projectsData.length} projects and ${tasksData.length} tasks`);

        const projectItems: ProjectItem[] = projectsData.map((p: any) => ({
            id: p.Id,
            type: 'project' as const,
            name: p.Name,
            status: this.mapStatus(p.Status__c || '--None--'),
            startDate: p.Start_Date__c || '',
            endDate: p.End_Date__c || '',
            budgetHours: p.Budget_Hours__c || 0,
            owner: p.Owner?.Name || 'System',
            progress: 0, // Field Progress__c does not exist
            children: []
        }));

        const taskItems: ProjectItem[] = tasksData.map((t: any) => ({
            id: t.Id,
            type: (t.Project_Task__c ? 'subtask' : 'task') as any,
            taskName: t.Name,
            status: this.mapStatus(t.Status__c || '--None--'),
            priority: this.mapPriority(t.Priority__c || 'Medium'),
            assignedTo: t.Assigned_To__r?.Name || 'Unassigned',
            dueDate: t.Due_Date__c || '',
            estimatedHours: t.Estimated_Hours__c || 0,
            description: t.Description__c || '',
            parentId: t.Project_Task__c ? t.Project_Task__c : t.Project__c,
            children: []
        }));

        // Build the hierarchy
        const itemMap = new Map<string, ProjectItem>();
        const allItems = [...projectItems, ...taskItems];

        // Populate map first
        allItems.forEach(item => {
            item.children = []; // Ensure empty children array
            itemMap.set(item.id, item);
        });

        const rootItems: ProjectItem[] = [];

        allItems.forEach(item => {
            if (item.parentId) {
                if (itemMap.has(item.parentId)) {
                    const parent = itemMap.get(item.parentId);
                    parent!.children!.push(item);
                    console.log(`[ProjectService] Linked ${item.type} ${item.taskName} to parent ${item.parentId}`);
                } else {
                    console.warn(`[ProjectService] Unlinked ${item.type} ${item.taskName}: Parent ${item.parentId} not found in fetch results.`);
                }
            } else if (item.type === 'project') {
                rootItems.push(item);
            } else {
                console.warn(`[ProjectService] Orphan ${item.type} ${item.taskName}: No parentId set (Project__c: null, Project_Task__c: null).`);
            }
        });

        console.log(`[ProjectService] Built hierarchy with ${rootItems.length} root items`);
        return rootItems;
    }

    private async getProjects() {
        const soql = `
            SELECT Id, Name, Status__c, Start_Date__c, End_Date__c, Account__c, Budget_Hours__c, Description__c 
            FROM Project__c 
            ORDER BY Name ASC
        `;
        const records = await salesforceApi.queryAll(soql);
        return records;
    }

    private async getAllTasks() {
        const soql = `
            SELECT Id, Name, Project__c, Project_Task__c, Project_Task__r.Name,
                   Status__c, Assigned_To__c, Assigned_To__r.Name, Due_Date__c,
                   Description__c, Priority__c,
                   Estimated_Hours__c, Actual_Hours__c,
                   Approved_Logged_Hours__c,
                   Related_Project__c,
                   Actual_Non_Billable_Hours__c,
                   Total_Sub_Task_Hours__c,
                   Total_Sub_Task_Non_Billable_Hours__c
            FROM Project_Task__c 
            ORDER BY CreatedDate ASC
        `;
        const records = await salesforceApi.queryAll(soql);
        return records;
    }

    async createProject(data: Partial<ProjectItem>) {
        const sfData = {
            Name: data.name,
            Status__c: data.status,
            Start_Date__c: data.startDate,
            End_Date__c: data.endDate,
            Budget_Hours__c: data.budgetHours,
            Account__c: data.account,
            OwnerId: data.owner ? undefined : undefined, // Owner is trickier to set by string name, we usually leave it to default/current user unless we select a user ID
            Description__c: data.description
        };
        return salesforceApi.create('Project__c', sfData);
    }

    async createTask(data: Partial<ProjectItem>, isSubtask: boolean) {
        const sfData = {
            Name: data.taskName,
            Status__c: data.status,
            Priority__c: data.priority,
            Due_Date__c: data.dueDate,
            Estimated_Hours__c: data.estimatedHours,
            Description__c: data.description,
            Project__c: isSubtask ? undefined : data.parentId,
            Project_Task__c: isSubtask ? data.parentId : undefined
        };
        return salesforceApi.create('Project_Task__c', sfData);
    }

    async updateItem(item: ProjectItem) {
        if (item.type === 'project') {
            const sfData = {
                Name: item.name,
                Status__c: item.status,
                Start_Date__c: item.startDate,
                End_Date__c: item.endDate,
                Budget_Hours__c: item.budgetHours
            };
            return salesforceApi.update('Project__c', item.id, sfData);
        } else {
            const sfData = {
                Name: item.taskName,
                Status__c: item.status,
                Priority__c: item.priority,
                Due_Date__c: item.dueDate,
                Estimated_Hours__c: item.estimatedHours,
                Description__c: item.description
            };
            return salesforceApi.update('Project_Task__c', item.id, sfData);
        }
    }

    async deleteItem(id: string, type: 'project' | 'task' | 'subtask') {
        const sobject = type === 'project' ? 'Project__c' : 'Project_Task__c';
        return salesforceApi.delete(sobject, id);
    }
}

export const projectService = new ProjectService();
