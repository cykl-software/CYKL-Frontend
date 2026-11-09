import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useCategories } from '../hooks/useCategories';
import { createDonation, getDonation, updateDonation, uploadDonationImage } from '../services/donations.service';
import type { Condition, DonationInput } from '../types';
import { CONDITIONS, IMAGE_TYPES, MAX_IMAGE_BYTES, UNITS } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { parseQuantity, validateDonation, type DonationFormValues, type FieldErrors } from '../utils/validation';
import { FormInput, FormSelect, FormTextarea } from '../components/ui/FormInput';
import Alert from '../components/ui/Alert';
import LoadingState from '../components/ui/LoadingState';

const EMPTY: DonationFormValues = { name: '', categoryId: '', description: '', quantity: '1', unit: '', condition: '', city: '', neighborhood: '' };

export default function ItemForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const existing = useAsync(() => (id ? getDonation(id) : Promise.resolve(null)), [id]);

  const [values, setValues] = useState<DonationFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Edição: carrega os valores do anúncio
  useEffect(() => {
    const d = existing.data;
    if (!d) return;
    setValues({
      name: d.name, categoryId: d.category_id, description: d.description, quantity: String(d.quantity),
      unit: d.unit ?? '', condition: d.condition, city: d.city, neighborhood: d.neighborhood,
    });
    setCurrentImage(d.image_url);
  }, [existing.data]);

  // Novo anúncio: sugere cidade/bairro do perfil
  useEffect(() => {
    if (editing || !profile) return;
    setValues((v) => ({ ...v, city: v.city || profile.city || '', neighborhood: v.neighborhood || profile.neighborhood || '' }));
  }, [editing, profile]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (editing && existing.loading) return <LoadingState />;
  if (editing && existing.error) return <Alert kind="error">{existing.error}</Alert>;
  if (editing) {
    const d = existing.data;
    if (!d || d.donor_id !== user?.id) return <Alert kind="error">Anúncio não encontrado.</Alert>;
    if (d.status !== 'disponivel' && d.status !== 'indisponivel') {
      return <Alert kind="info">Anúncios reservados ou concluídos não podem ser editados. <Link to="/conta/anuncios" className="font-semibold underline">Voltar</Link></Alert>;
    }
  }

  const set = (k: keyof DonationFormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues({ ...values, [k]: e.target.value });

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFormError(null);
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) { setFormError('Use uma imagem JPG, PNG ou WebP.'); return; }
    if (f.size > MAX_IMAGE_BYTES) { setFormError('A imagem deve ter no máximo 2 MB.'); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateDonation(values);
    setErrors(v); setFormError(null);
    if (Object.keys(v).length || !user) return;
    setBusy(true);
    try {
      const image_url = file ? await uploadDonationImage(user.id, file) : currentImage;
      const input: DonationInput = {
        category_id: values.categoryId, name: values.name.trim(), description: values.description.trim(),
        quantity: parseQuantity(values.quantity), unit: values.unit || null, condition: values.condition as Condition,
        city: values.city.trim(), neighborhood: values.neighborhood.trim(), image_url,
      };
      if (id) await updateDonation(id, input); else await createDonation(user.id, input);
      navigate('/conta/anuncios');
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const shownImage = preview ?? currentImage;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">{editing ? 'Editar anúncio' : 'Anunciar um item'}</h1>
      <p className="mt-1 text-sm text-ink-soft">A doação é do lote completo: quem pedir recebe tudo o que você descrever aqui.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5">
        {formError && <Alert kind="error">{formError}</Alert>}
        <FormInput label="Nome do item" required maxLength={150} placeholder="Ex.: Sofá de 3 lugares" value={values.name} error={errors.name} onChange={set('name')} />
        <FormSelect label="Categoria" required value={values.categoryId} error={errors.categoryId} onChange={set('categoryId')}>
          <option value="">Selecione…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FormSelect>
        <FormTextarea label="Descrição" required placeholder="Marca, tamanho, funcionamento, detalhes importantes" value={values.description} error={errors.description} onChange={set('description')} />
        <div className="grid gap-4 sm:grid-cols-3">
          <FormInput label="Quantidade" required inputMode="decimal" value={values.quantity} error={errors.quantity} onChange={set('quantity')} />
          <FormSelect label="Unidade" value={values.unit} error={errors.unit} onChange={set('unit')}>
            <option value="">Não se aplica</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </FormSelect>
          <FormSelect label="Estado de conservação" required value={values.condition} error={errors.condition} onChange={set('condition')}>
            <option value="">Selecione…</option>
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </FormSelect>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Cidade" required value={values.city} error={errors.city} onChange={set('city')} />
          <FormInput label="Bairro" required value={values.neighborhood} error={errors.neighborhood} onChange={set('neighborhood')} />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Foto <span className="font-normal text-ink-soft">(opcional)</span></span>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-500 bg-brand-50 p-3 hover:bg-brand-100">
            {shownImage ? <img src={shownImage} alt="Pré-visualização" className="h-16 w-16 rounded-md object-cover" /> : <ImagePlus className="text-brand-600" size={28} />}
            <span className="text-sm text-ink-soft">{shownImage ? 'Trocar foto' : 'Escolher foto'} · JPG, PNG ou WebP até 2 MB</span>
            <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={onFile} />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Link to="/conta/anuncios" className="btn-outline">Cancelar</Link>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />} {editing ? 'Salvar alterações' : 'Publicar anúncio'}
          </button>
        </div>
      </form>
    </div>
  );
}
