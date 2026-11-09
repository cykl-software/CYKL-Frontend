import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { validateRegister, type FieldErrors } from '../utils/validation';
import { FormInput } from '../components/ui/FormInput';
import Alert from '../components/ui/Alert';

export default function Register() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session && !busy) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateRegister(values);
    setErrors(v); setFormError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const hasSession = await signUp(values.name, values.email, values.password);
      if (hasSession) navigate(from, { replace: true }); else setNeedsConfirmation(true);
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const set = (k: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: e.target.value });

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Crie sua conta</h1>
        <p className="mt-1 text-sm text-ink-soft">Leva menos de um minuto. Telefone e endereço você completa depois, no perfil.</p>
        {needsConfirmation ? (
          <div className="mt-6"><Alert kind="success">Conta criada. Enviamos um link de confirmação para {values.email}. Confirme o e-mail e depois <Link className="font-semibold underline" to="/login">entre na sua conta</Link>.</Alert></div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {formError && <Alert kind="error">{formError}</Alert>}
            <FormInput label="Nome" autoComplete="name" required value={values.name} error={errors.name} onChange={set('name')} />
            <FormInput label="E-mail" type="email" autoComplete="email" required value={values.email} error={errors.email} onChange={set('email')} />
            <FormInput label="Senha" type="password" autoComplete="new-password" required hint="Mínimo de 8 caracteres." value={values.password} error={errors.password} onChange={set('password')} />
            <FormInput label="Confirme a senha" type="password" autoComplete="new-password" required value={values.confirm} error={errors.confirm} onChange={set('confirm')} />
            <button type="submit" className="btn-primary w-full" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />} Criar conta</button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-ink-soft">Já tem conta? <Link to="/login" state={location.state} className="font-semibold text-brand-700 hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
