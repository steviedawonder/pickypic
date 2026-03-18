import { Studio } from 'sanity';
import config from '../../../sanity.config';
import PasswordGate from './PasswordGate';

export default function StudioWrapper() {
  return (
    <PasswordGate>
      <Studio config={config} />
    </PasswordGate>
  );
}
