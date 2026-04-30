import type { JSX } from 'react';
import { File, FileSpreadsheet, FileText } from 'lucide-react';
import type { WallAttachment } from '../../domain/wall';
import { formatFileSize } from '@shared/utils/file';

// ─── Component interface ──────────────────────────────────────────────────────
// Every participant in the decorator chain (base + all decorators) must satisfy
// this contract so they are interchangeable at the call site.

export interface RenderProps {
  attachment: WallAttachment;
  onOpen: () => Promise<void>;
  imageUrl: string | null;
}

export interface IAttachmentDisplay {
  render(props: RenderProps): JSX.Element;
}

// ─── ConcreteComponent ────────────────────────────────────────────────────────
// The base object being decorated. Renders a generic file chip with no
// type-specific styling.

export class BaseAttachmentDisplay implements IAttachmentDisplay {
  render({ attachment, onOpen }: RenderProps): JSX.Element {
    return (
      <button
        type="button"
        onClick={() => void onOpen()}
        className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 transition hover:bg-ink-100"
      >
        <File size={22} className="text-ink-500" />
        <div className="text-left">
          <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">
            {attachment.fileName}
          </p>
          <p className="text-xs text-ink-400">
            Archivo · {formatFileSize(attachment.fileSize)}
          </p>
        </div>
      </button>
    );
  }
}

// ─── Decorator (abstract) ─────────────────────────────────────────────────────
// Holds a reference to the wrapped IAttachmentDisplay and delegates by default.
// Concrete decorators extend this and override render() to add type-specific
// behavior.

export abstract class AttachmentDecorator implements IAttachmentDisplay {
  protected readonly wrapped: IAttachmentDisplay;

  constructor(wrapped: IAttachmentDisplay) {
    this.wrapped = wrapped;
  }

  render(props: RenderProps): JSX.Element {
    return this.wrapped.render(props);
  }
}


// ─── ConcreteDecorator: PDF ───────────────────────────────────────────────────

export class PdfAttachmentDecorator extends AttachmentDecorator {
  override render({ attachment, onOpen }: RenderProps): JSX.Element {
    return (
      <button
        type="button"
        onClick={() => void onOpen()}
        className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 transition hover:bg-ink-100"
      >
        <FileText size={22} className="text-red-500" />
        <div className="text-left">
          <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">
            {attachment.fileName}
          </p>
          <p className="text-xs text-ink-400">
            PDF · {formatFileSize(attachment.fileSize)}
          </p>
        </div>
      </button>
    );
  }
}

// ─── ConcreteDecorator: Excel ─────────────────────────────────────────────────

export class ExcelAttachmentDecorator extends AttachmentDecorator {
  override render({ attachment, onOpen }: RenderProps): JSX.Element {
    return (
      <button
        type="button"
        onClick={() => void onOpen()}
        className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 transition hover:bg-ink-100"
      >
        <FileSpreadsheet size={22} className="text-green-600" />
        <div className="text-left">
          <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">
            {attachment.fileName}
          </p>
          <p className="text-xs text-ink-400">
            Excel · {formatFileSize(attachment.fileSize)}
          </p>
        </div>
      </button>
    );
  }
}

// ─── ConcreteDecorator: Image ─────────────────────────────────────────────────

export class ImageAttachmentDecorator extends AttachmentDecorator {
  override render({ attachment, onOpen, imageUrl }: RenderProps): JSX.Element {
    return (
      <button
        type="button"
        onClick={() => void onOpen()}
        className="block overflow-hidden rounded-lg border border-ink-100 transition hover:opacity-90"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={attachment.fileName}
            className="h-40 max-w-xs object-cover"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center bg-ink-100">
            <span className="text-xs text-ink-400">Cargando imagen...</span>
          </div>
        )}
      </button>
    );
  }
}
