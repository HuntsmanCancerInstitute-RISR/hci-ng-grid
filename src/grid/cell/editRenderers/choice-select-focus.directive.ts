import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from "@angular/core";

@Directive({
    selector: "[autofocus]"
})
export class ChoiceSelectFocusDirective implements AfterViewInit {
    @Input() set autofocus(_) {
        this.host.nativeElement.focus();
    }

    constructor(private host: ElementRef<HTMLDListElement>,
                private renderer: Renderer2) {
    }
    ngAfterViewInit() {
        this.renderer.removeStyle(this.host.nativeElement, "height");
    }

}
