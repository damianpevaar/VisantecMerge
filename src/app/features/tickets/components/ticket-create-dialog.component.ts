import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientOrganization } from '../../../core/domain/tickets/client-organization';
import { CreateTicketInput, TicketAttachmentInput } from '../../../core/domain/tickets/ticket-commands';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_OPTIONS } from '../../../core/enums/ticket-priority';
import { toBase64 } from '../../../core/utils/file-utils';
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';

export interface TicketCreateDialogData {
    organizations: ClientOrganization[];
    defaultEmail?: string;
}

@Component({
    selector: 'app-ticket-create-dialog',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
    templateUrl: './ticket-create-dialog.component.html',
    styleUrl: './ticket-create-dialog.component.scss'
})
export class TicketCreateDialogComponent {

    private readonly _fb = inject(FormBuilder);
    private readonly _dialogRef = inject(MatDialogRef<TicketCreateDialogComponent, CreateTicketInput>);
    readonly data: TicketCreateDialogData = inject<TicketCreateDialogData>(MAT_DIALOG_DATA);

    readonly priorities = TICKET_PRIORITY_OPTIONS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;

    attachments: TicketAttachmentInput[] = [];
    isUploading = false;

    readonly form = this._fb.group({
        subject: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(5)]],
        priority: [TicketPriority.Medium, Validators.required],
        clientOrganizationId: [null as string | null],
        requestedByEmail: ['', [Validators.required, Validators.email]],
        requestedByName: ['']
    });

    constructor() {
        if (this.data?.defaultEmail) {
            this.form.patchValue({ requestedByEmail: this.data.defaultEmail });
        }
    }

    async handleFileChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) {
            return;
        }

        this.isUploading = true;
        try {
            const uploads: TicketAttachmentInput[] = [];
            for (const file of Array.from(input.files)) {
                const base64 = await toBase64(file);
                uploads.push({
                    fileName: file.name,
                    contentType: file.type || 'application/octet-stream',
                    fileSize: file.size,
                    base64Data: base64
                });
            }
            this.attachments = [...this.attachments, ...uploads];
        } finally {
            this.isUploading = false;
            input.value = '';
        }
    }

    removeAttachment(index: number): void {
        this.attachments = this.attachments.filter((_, i) => i !== index);
    }

    save(): void {
        if (this.form.invalid || this.isUploading) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.value;
        this._dialogRef.close({
            subject: value.subject ?? '',
            description: value.description ?? '',
            priority: value.priority ?? TicketPriority.Medium,
            clientOrganizationId: value.clientOrganizationId ?? null,
            requestedByEmail: value.requestedByEmail ?? '',
            requestedByName: value.requestedByName ?? null,
            attachments: [...this.attachments]
        });
    }

    cancel(): void {
        this._dialogRef.close();
    }
}
