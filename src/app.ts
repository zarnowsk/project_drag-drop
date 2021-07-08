// Drag & drop interfaces
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

// Validation
interface Validateable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validateable) {
    let isValid = true;

    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0
    }
    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }

    return isValid
}

// DECORATORS

// Autobinder to 'this' decorator
function Autobinder(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFunction = originalMethod.bind(this);
            return boundFunction;
        }
    }
    return adjustedDescriptor;
}

// CUSTOM TYPES

enum ProjectStatus { Active, Finished}
type Listener<T> = (items: T[]) => void;

// CLASSES
class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

class ProjectState extends State<Project> {
    
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        } else {
            this.instance = new ProjectState();
            return this.instance;
        }
    }

    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(Math.random.toString(), title, description, numOfPeople, ProjectStatus.Active);

        this.projects.push(newProject);
        this.updateListeners();
        
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find(project => project.id === projectId)
        if (project && project.status !== newStatus) {
            project.status = newStatus;
        }

        this.updateListeners();
    }

    private updateListeners() {
        // Execute all listeners with current projects
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice()); // copy of projects
        }
    }
}

// Abstract class to prevent instanciation, only used for inheritance
abstract class Component<T extends HTMLElement, U extends HTMLElement> {

    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement; // get HTML template element
        this.hostElement = document.getElementById(hostElementId)! as T; // get HTML element where to insert template

        const importedNode = document.importNode(this.templateElement.content, true); // import template content
        this.element = importedNode.firstElementChild as U; // get first child element of imported content
        if (newElementId) {
            this.element.id = newElementId; // set ID for styling
        }

        this.attach(insertAtStart); // insert into DOM
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element);
    }

    abstract configure(): void;

    abstract renderContent(): void;
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');

        this.titleInputElement = this.element.querySelector('#title')!
        this.descriptionInputElement = this.element.querySelector('#description')!
        this.peopleInputElement = this.element.querySelector('#people')!

        this.configure();
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const eneteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validateable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: Validateable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }
        const peopleValidatable: Validateable = {
            value: +eneteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if (!validate(titleValidatable) || !validate(descriptionValidatable) || !validate(peopleValidatable)) {
            alert('Invalid input! Try again')
            return;
        } else {
            return [enteredTitle, enteredDescription, +eneteredPeople];
        }
    }

    private clearInputs() {
        this.titleInputElement.value = ''
        this.descriptionInputElement.value = ''
        this.peopleInputElement.value = ''
    }

    @Autobinder
    private submitHandler(event: Event) {
        event.preventDefault();

        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput
            projectState.addProject(title, desc, people);
            this.clearInputs()
        }
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler)
    }

    renderContent() {}
}

class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {

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

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {

    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        } else {
            return `${this.project.people} persons`
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }

    @Autobinder
    dragStartHandler(event: DragEvent) {
        // Attach project ID to drag event
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_event: DragEvent) {
        console.warn('DragEnd')
    }
}

class Project {

    constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {}
}

// -- MAIN --

// Singleton instance of state
const projectState = ProjectState.getInstance();

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');