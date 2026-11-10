import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../services/profile.service';
import { getErrorMessage } from '../utils/errors';
import { validateProfile, type FieldErrors } from '../utils/validation';
import { FormInput } from '../components/ui/FormInput';
import Alert from '../components/ui/Alert';
import LoadingState from '../components/ui/LoadingState';

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const [values, setValues] = useState({ name: '', phone: '', city: '', neighborhood: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setValues({ name: profile.name, phone: profile.phone ?? '', city: profile.city ?? '', neighborhood: profile.neighborhood ?? '' });
  }, [profile]);

  if (!profile || !user) return <LoadingState />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateProfile(values);
    setErrors(v); setStatus(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const updated = await updateProfile(user.id, {
        name: values.name.trim(), phone: values.phone.trim() || null,
        city: values.city.trim() || null, neighborhood: values.neighborhood.trim() || null,
      });
      setProfile(updated);
      setStatus({ kind: 'success', text: 'Perfil atualizado.' });
    } catch (err) { setStatus({ kind: 'error', text: getErrorMessage(err) }); }
    finally { setBusy(false); }
  };

  const set = (k: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: e.target.value });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <p className="mt-1 text-sm text-ink-soft">Só você vê estes dados. Seu contato é compartilhado apenas com a outra parte de uma solicitação aprovada.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5">
        {status && <Alert kind={status.kind}>{status.text}</Alert>}
        <FormInput label="Nome" required autoComplete="name" value={values.name} error={errors.name} onChange={set('name')} />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="profile-email">E-mail</label>
          <input id="profile-email" readOnly value={profile.email} className="block w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft" />
        </div>
        <FormInput label="Telefone" type="tel" autoComplete="tel" placeholder="(81) 91234-5678" hint="Usado para combinar a retirada quando uma solicitação for aprovada." value={values.phone} error={errors.phone} onChange={set('phone')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Cidade" value={values.city} onChange={set('city')} />
          <FormInput label="Bairro" value={values.neighborhood} onChange={set('neighborhood')} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />} Salvar alterações</button>
      </form>
    </div>
  );
}
