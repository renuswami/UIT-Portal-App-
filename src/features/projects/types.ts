export type ProjectItemType = 'project' | 'task' | 'subtask';

export type ProjectStatus = '--None--' | 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ProjectItem {
    id: string;
    type: ProjectItemType;

    // Project Specific Fields (Project__c)
    name?: string; // Standard name for project
    startDate?: string;
    endDate?: string;
    budgetHours?: number;
    owner?: string;
    account?: string;

    // Task & Subtask Specific Fields (Project_Task__c)
    taskName?: string;
    priority?: TaskPriority;
    assignedTo?: string;
    dueDate?: string;
    estimatedHours?: number;
    description?: string;

    // Common Fields
    status: ProjectStatus;
    progress?: number; // 0 to 100
    children?: ProjectItem[];
    parentId?: string; // Lookup to Project__c or Parent Task
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
    '--None--': '#8E8E93',
    'Planning': '#FF9500',
    'In Progress': '#0A84FF',
    'On Hold': '#FF3B30',
    'Completed': '#34C759',
    'Cancelled': '#8E8E93',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
    'Low': '#34C759',
    'Medium': '#FF9500',
    'High': '#FF3B30',
};
