import { Component } from "./base.js";
import { Validateable, validate } from "../util/validation.js";
import { Autobinder } from "../decorators/autobind.js";
import { projectState } from "../state/project-state.js";

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

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