import { useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAsyncTask, useCatchCallback } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useManager, useRestriction } from '../common/util/permissions';
import PageLayout from '../common/components/PageLayout';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import fetchOrThrow from '../common/util/fetchOrThrow';

const BillingPage = () => {
  const t = useTranslation();
  const currentUser = useSelector((state) => state.session.user);
  const manager = useManager();
  const readonly = useRestriction('readonly');
  const [userId, setUserId] = useState(currentUser.id);
  const [account, setAccount] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dueDate, setDueDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [graceDays, setGraceDays] = useState(10);
  const [timeZone, setTimeZone] = useState('America/Manaus');
  const [migrateExpiration, setMigrateExpiration] = useState(false);
  const [amount, setAmount] = useState('');
  const [nextDueDate, setNextDueDate] = useState(() =>
    dayjs().add(1, 'month').format('YYYY-MM-DD'),
  );
  const [referenceKey, setReferenceKey] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [reload, refresh] = useReducer((value) => value + 1, 0);
  const editable = manager && !readonly && userId !== currentUser.id && loadedUserId === userId;

  useAsyncTask(
    async ({ signal }) => {
      void reload;
      setLoadedUserId(null);
      setAccount(null);
      setPayments([]);
      if (!userId) return;
      const [accountResponse, paymentResponse] = await Promise.all([
        fetchOrThrow(`api/users/${userId}/billing`, { signal }),
        fetchOrThrow(`api/users/${userId}/billing/payments`, { signal }),
      ]);
      const value = accountResponse.status === 204 ? null : await accountResponse.json();
      const paymentValues = await paymentResponse.json();
      if (signal.aborted) return;
      setAccount(value);
      setPayments(paymentValues);
      setLoadedUserId(userId);
      setDueDate(value?.dueDate || dayjs().format('YYYY-MM-DD'));
      setGraceDays(value?.graceDays ?? 10);
      setTimeZone(value?.timeZone || 'America/Manaus');
      setMigrateExpiration(false);
    },
    [userId, reload],
  );

  const save = useCatchCallback(async () => {
    setSaving(true);
    try {
      await fetchOrThrow(`api/users/${userId}/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate,
          graceDays: Number(graceDays),
          timeZone,
          version: account?.version || 0,
          migrateExpiration,
        }),
      });
      refresh();
    } finally {
      setSaving(false);
    }
  }, [userId, dueDate, graceDays, timeZone, account, migrateExpiration]);

  const confirm = useCatchCallback(async () => {
    setSaving(true);
    try {
      await fetchOrThrow(`api/users/${userId}/billing/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, nextDueDate, referenceKey }),
      });
      setReferenceKey(crypto.randomUUID());
      setAmount('');
      refresh();
    } finally {
      setSaving(false);
    }
  }, [userId, amount, nextDueDate, referenceKey]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'billingTitle']}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {manager && (
          <SelectField
            label={t('settingsUser')}
            endpoint="api/users"
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value);
              setReferenceKey(crypto.randomUUID());
            }}
          />
        )}
        <Alert
          severity={
            account?.status === 'suspended'
              ? 'error'
              : account?.status === 'grace'
                ? 'warning'
                : 'info'
          }
        >
          {account
            ? `${t(`billingState${account.status[0].toUpperCase()}${account.status.slice(1)}`)} — ${t('billingDue')}: ${account.dueDate} — ${t('billingSuspension')}: ${new Date(account.suspensionTime).toLocaleString()}`
            : t('billingNotConfigured')}
        </Alert>
        {editable && (
          <>
            <TextField
              type="date"
              label={t('billingDue')}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="number"
              label={t('billingGraceDays')}
              value={graceDays}
              onChange={(event) => setGraceDays(event.target.value)}
            />
            <TextField
              label={t('billingTimeZone')}
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
            />
            {!account && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={migrateExpiration}
                    onChange={(_, value) => setMigrateExpiration(value)}
                  />
                }
                label={t('billingMigrateExpiration')}
              />
            )}
            <Button
              variant="contained"
              disabled={
                saving ||
                !dueDate ||
                !timeZone ||
                !Number.isInteger(Number(graceDays)) ||
                Number(graceDays) < 0 ||
                Number(graceDays) > 365
              }
              onClick={save}
            >
              {t('sharedSave')}
            </Button>
            {account && (
              <>
                <Typography variant="h6">{t('billingConfirmPayment')}</Typography>
                <TextField
                  type="number"
                  label={t('billingAmount')}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <TextField
                  type="date"
                  label={t('billingNextDue')}
                  value={nextDueDate}
                  onChange={(event) => setNextDueDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button
                  variant="contained"
                  disabled={saving || Number(amount) <= 0 || !amount || !nextDueDate}
                  onClick={confirm}
                >
                  {t('billingConfirmPayment')}
                </Button>
              </>
            )}
          </>
        )}
        <Typography variant="h6">{t('billingPayments')}</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('billingPaidAt')}</TableCell>
              <TableCell>{t('billingAmount')}</TableCell>
              <TableCell>{t('billingNextDue')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.paidAt).toLocaleString()}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: payment.currency,
                  }).format(payment.amount)}
                </TableCell>
                <TableCell>{payment.nextDue}</TableCell>
              </TableRow>
            ))}
            {!payments.length && (
              <TableRow>
                <TableCell colSpan={3}>{t('sharedNoData')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </PageLayout>
  );
};

export default BillingPage;
