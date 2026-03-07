import { ProjectItem } from './types';

export const MOCK_PROJECTS: ProjectItem[] = [
    {
        id: 'p1',
        type: 'project',
        name: 'ERP System Implementation',
        status: 'In Progress',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        budgetHours: 2500,
        owner: 'John Smith',
        progress: 45,
        children: [
            {
                id: 'p1-t1',
                type: 'task',
                taskName: 'Requirements Gathering',
                status: 'Completed',
                priority: 'High',
                assignedTo: 'Emily Davis',
                dueDate: '2026-03-20',
                estimatedHours: 40,
                description: 'Collect all stakeholders requirements for the new ERP.',
                children: [
                    {
                        id: 'p1-t1-st1',
                        type: 'subtask',
                        taskName: 'Stakeholder Interviews',
                        status: 'Completed',
                        assignedTo: 'Emily Davis',
                        dueDate: '2026-03-10',
                        estimatedHours: 20,
                    },
                    {
                        id: 'p1-t1-st2',
                        type: 'subtask',
                        taskName: 'Documenting BRDs',
                        status: 'Completed',
                        assignedTo: 'Sarah Miller',
                        dueDate: '2026-03-15',
                        estimatedHours: 20,
                    }
                ]
            },
            {
                id: 'p1-t2',
                type: 'task',
                taskName: 'System Architecture Design',
                status: 'In Progress',
                priority: 'High',
                assignedTo: 'Michael Brown',
                dueDate: '2026-04-10',
                estimatedHours: 80,
                description: 'Design the core modules and database schema.',
                children: []
            }
        ]
    },
    {
        id: 'p2',
        type: 'project',
        name: 'Website Refresh 2026',
        status: '--None--',
        startDate: '2026-05-01',
        endDate: '2026-08-15',
        budgetHours: 600,
        owner: 'Robert Wilson',
        progress: 0,
        children: []
    }
];
