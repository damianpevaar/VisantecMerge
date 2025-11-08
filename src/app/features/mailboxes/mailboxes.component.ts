import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ManagedMailbox } from '../../core/domain/tickets/managed-mailbox';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { ManagedMailboxService, UpdateMailboxInput } from '../../core/services/managed-mailbox.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';

@Component({
    selector: 'app-mailboxes',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
    templateUrl: './mailboxes.component.html',
    styleUrl: './mailboxes.component.scss'
})
export class MailboxesComponent implements OnInit, OnDestroy {

    private readonly _fb = inject(FormBuilder);
    private readonly _ticketGraphql = inject(TicketGraphqlService);
    private readonly _mailboxService = inject(ManagedMailboxService);
    private readonly _snackBar = inject(MatSnackBar);

    mailboxes: ManagedMailbox[] = [];
    selectedMailbox: ManagedMailbox | null = null;
    loading = true;
    saving = false;

    readonly form = this._fb.group({
        displayName: ['', Validators.required],
        description: [''],
        isActive: [true],
        autoResponseEnabled: [true],
        autoResponseTemplate: ['', Validators.required]
    });

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this._ticketGraphql.watchManagedMailboxes()
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data, loading }) => {
                this.loading = loading;
                this.mailboxes = data?.managedMailboxes?.nodes ?? [];
                if (!this.selectedMailbox && this.mailboxes.length) {
                    this.selectMailbox(this.mailboxes[0]);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectMailbox(mailbox: ManagedMailbox): void {
        this.selectedMailbox = mailbox;
        this.form.reset({
            displayName: mailbox.displayName ?? '',
            description: mailbox.description ?? '',
            isActive: mailbox.isActive,
            autoResponseEnabled: mailbox.autoResponseEnabled,
            autoResponseTemplate: mailbox.autoResponseTemplate ?? ''
        });
    }

    save(): void {
        if (!this.selectedMailbox || this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload: UpdateMailboxInput = {
            displayName: this.form.value.displayName ?? '',
            description: this.form.value.description ?? '',
            isActive: this.form.value.isActive ?? true,
            autoResponseEnabled: this.form.value.autoResponseEnabled ?? true,
            autoResponseTemplate: this.form.value.autoResponseTemplate ?? ''
        };

        this.saving = true;
        this._mailboxService.updateMailbox(this.selectedMailbox.id, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this._snackBar.open('Buzon actualizado', 'Cerrar', { duration: 3000 });
                    this.selectMailbox(updated);
                },
                error: () => this._snackBar.open('No se pudo actualizar el buzon', 'Cerrar', { duration: 4000 })
            })
            .add(() => this.saving = false);
    }
}