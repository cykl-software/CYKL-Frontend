import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps { label: string; error?: string; hint?: string; required?: boolean }

const base =
  'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25';

function Field({ id, label, error, hint, required, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span className="text-red-600" aria-hidden="true"> *</span> : <span className="font-normal text-ink-soft"> (opcional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

const aria = (id: string, error?: string) => ({ 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined });
const border = (error?: string) => (error ? 'border-red-500' : 'border-line');

export function FormInput({ label, error, hint, required, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <input id={id} required={false} className={`${base} ${border(error)}`} {...aria(id, error)} {...rest} />
    </Field>
  );
}

export function FormTextarea({ label, error, hint, required, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <textarea id={id} rows={4} className={`${base} ${border(error)}`} {...aria(id, error)} {...rest} />
    </Field>
  );
}

export function FormSelect({ label, error, hint, required, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <select id={id} className={`${base} ${border(error)}`} {...aria(id, error)} {...rest}>{children}</select>
    </Field>
  );
}

export default FormInput;
