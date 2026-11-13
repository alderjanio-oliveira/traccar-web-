import { useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import fetchOrThrow from '../common/util/fetchOrThrow';

const BillingBanner = () => {
  const t = useTranslation();
  const userId = useSelector((state) => state.session.user.id);
  const [account, setAccount] = useState(null);
  const [reload, refresh] = useReducer((value) => value + 1, 0);
  useEffect(() => {
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);
  useAsyncTask(
    async ({ signal }) => {
      void reload;
      const response = await fetchOrThrow(`api/users/${userId}/billing`, { signal });
      setAccount(response.status === 204 ? null : await response.json());
    },
    [userId, reload],
  );
  return account?.status === 'grace' ? (
    <Alert severity="warning">
      {t('billingGraceWarning')} {account.dueDate}.{' '}
      <Link component={RouterLink} to="/settings/billing">
        {t('billingTitle')}
      </Link>
    </Alert>
  ) : null;
};

export default BillingBanner;
