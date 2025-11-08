import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReplyToTicketInput, TicketAttachmentInput } from '../../../core/domain/tickets/ticket-commands';
import { toBase64 } from '../../../core/utils/file-utils';
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';

@Component({
    selector: 'app-ticket-reply-form',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
    templateUrl: './ticket-reply-form.component.html',
    styleUrl: './ticket-reply-form.component.scss'
})
export class TicketReplyFormComponent {

    private readonly _fb = inject(FormBuilder);

    @Input() disabled = false;
    @Output() submitReply = new EventEmitter<ReplyToTicketInput>();

    attachments: TicketAttachmentInput[] = [];
    isUploading = false;

    readonly form = this._fb.group({
        message: ['', [Validators.required, Validators.minLength(3)]],
        isInternal: [false]
    });

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

    submit(): void {
        if (this.form.invalid || this.disabled) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitReply.emit({
            message: this.form.value.message ?? '',
            isInternal: this.form.value.isInternal ?? false,
            attachments: [...this.attachments]
        });

        this.form.reset({ message: '', isInternal: false });
        this.attachments = [];
    }
}