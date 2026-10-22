import { CloseIcon } from '../icons/Icon';
import TemplatePicker from './TemplatePicker';
import './TemplateModal.css';

export default function TemplateModal({ open, onClose, onSend, recipient }) {
  if (!open) return null;

  return (
    <div className="template-modal__overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal__header">
          <div className="template-modal__header-row">
            <p className="template-modal__title">Choose a WhatsApp template</p>
            <button type="button" className="template-modal__close" onClick={onClose}>
              <CloseIcon size={16} />
            </button>
          </div>
          <p className="template-modal__subtitle">
            Select a template on the left to preview and fill it. The customer sees it exactly as
            previewed.
          </p>
          {recipient && (
            <div className="template-modal__recipient">
              <span className="template-modal__recipient-label">To</span>
              <span className="template-modal__recipient-chip">
                {recipient.flag && <span className="template-modal__recipient-flag">{recipient.flag}</span>}
                {recipient.name && <span className="template-modal__recipient-name">{recipient.name}</span>}
                <span className="template-modal__recipient-number">{recipient.phone}</span>
              </span>
            </div>
          )}
        </div>

        <TemplatePicker onSend={onSend} onDone={onClose} />
      </div>
    </div>
  );
}
