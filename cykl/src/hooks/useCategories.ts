import { useAsync } from './useAsync';
import { listCategories } from '../services/categories.service';

export function useCategories() {
  const { data, loading, error } = useAsync(listCategories, []);
  return { categories: data ?? [], loading, error };
}
