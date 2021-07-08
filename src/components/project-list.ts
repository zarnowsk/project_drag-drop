import { Component } from "./base.js";
import { Autobinder } from "../decorators/autobind.js";
import { projectState } from "../state/project-state.js";
import { Project, ProjectStatus } from "../models/project.js";
import { DragTarget } from "../models/drag-drop.js";
import { ProjectItem } from "../components/project-item.js";


export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {

    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)!;
        listEl.innerHTML = ''; //clear list before render
        for (const prjItem of this.assignedProjects) {
            const listItem = new ProjectItem(this.element.id, prjItem)
            listEl.appendChild(listItem.element)
        }
    }

    configure() {

        // Register listeners for drag/drop events
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('drop', this.dropHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);

        // Register listener for project updates
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(project => {
                if (this.type === 'active') {
                    return project.status === ProjectStatus.Active
                } else {
                    return project.status === ProjectStatus.Finished
                }
            })
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        })
    }

    renderContent() {
        // Set ID of unordered list
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;

        // Set header content
        this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;
    }

    @Autobinder
    dragOverHandler(event: DragEvent) {
        
        // Check if element has data transfer set to our type set in ProjectItem class
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            
            event.preventDefault();

            // Add droppable styling
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }

    }
    
    @Autobinder
    dropHandler(event: DragEvent) {

        // Extract moved project's ID from event
        const projectId = event.dataTransfer!.getData('text/plain');

        // Update project's status based on this type
        projectState.moveProject(projectId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    }

    @Autobinder
    dragLeaveHandler(_event: DragEvent) {

        // Remove droppable styling
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }
}