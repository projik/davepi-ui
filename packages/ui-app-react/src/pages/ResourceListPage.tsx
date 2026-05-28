import { useParams } from 'react-router-dom';
import { ResourceTable } from '@/components/ResourceTable';

export function ResourceListPage() {
  const params = useParams<{ path: string }>();
  const path = params.path ?? '';
  return <ResourceTable resourcePath={path} />;
}
