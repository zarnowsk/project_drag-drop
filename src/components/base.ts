// Abstract class to prevent instanciation, only used for inheritance
export abstract class Component<T extends HTMLElement, U extends HTMLElement> {

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