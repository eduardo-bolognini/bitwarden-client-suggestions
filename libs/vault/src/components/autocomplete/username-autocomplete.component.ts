import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output, signal } from "@angular/core";

@Component({
  selector: "vault-username-autocomplete",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="visible() && suggestions().length > 0"
      class="tw-absolute tw-inset-x-0 tw-top-full tw-z-[99999] tw-mt-0.5"
    >
      <div
        class="tw-flex tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-border-secondary-300 tw-bg-background tw-shadow-lg tw-py-1 tw-max-h-48 tw-overflow-y-auto"
        role="listbox"
      >
        <!-- Header -->
        <div
          class="tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-muted tw-uppercase tw-tracking-wide"
        >
          {{ headerText() }}
        </div>

        <!-- Suggestions -->
        <div
          *ngFor="let username of suggestions(); let i = index"
          class="tw-px-3 tw-py-2 tw-cursor-pointer tw-text-sm tw-transition-colors hover:tw-bg-primary-100"
          [class.tw-bg-primary-100]="selectedIndex() === i"
          (mousedown)="selectItem($event, username)"
          (mouseenter)="selectedIndex.set(i)"
          role="option"
        >
          {{ username }}
        </div>
      </div>
    </div>
  `,
})
export class UsernameAutocompleteComponent {
  readonly suggestions = input<string[]>([]);
  readonly visible = input(false);
  readonly headerText = input("Recent usernames");
  selected = output<string>();

  readonly selectedIndex = signal(-1);

  selectItem(event: MouseEvent, username: string) {
    this.selected.emit(username);
    this.selectedIndex.set(-1);
  }
}
