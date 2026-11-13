import { useReducer, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useAsyncTask, useCatchCallback } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import fetchOrThrow from '../common/util/fetchOrThrow';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const NotificationDeliveriesPage = () => {
  const t = useTranslation();
  const [deviceId, setDeviceId] = useState(null);
  const [items, setItems] = useState([]);
  const [reload, refresh] = useReducer((value) => value + 1, 0);
  const [history, setHistory] = useState(null);

  useAsyncTask(
    async ({ signal }) => {
      void reload;
      setItems([]);
      if (deviceId) {
        const response = await fetchOrThrow(`api/devices/${deviceId}/notification-deliveries`, {
          signal,
        });
        setItems(await response.json());
      }
    },
    [deviceId, reload],
  );

  const showAttempts = useCatchCallback(
    async (item) => {
      const response = await fetchOrThrow(
        `api/devices/${deviceId}/notification-deliveries/${item.id}/attempts`,
      );
      setHistory(await response.json());
    },
    [deviceId],
  );

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'notificationDeliveryTitle']}
    >
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <SelectField
          fullWidth
          label={t('deviceTitle')}
          endpoint="api/devices"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
        />
        <Button onClick={refresh}>{t('notificationRefresh')}</Button>
      </Box>
      <Alert severity="info" sx={{ mx: 2 }}>
        {t('notificationDeliveryHelp')}
      </Alert>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('positionEvent')}</TableCell>
            <TableCell>{t('notificationNotificators')}</TableCell>
            <TableCell>{t('deviceStatus')}</TableCell>
            <TableCell>{t('notificationAttempts')}</TableCell>
            <TableCell>{t('notificationNextAttempt')}</TableCell>
            <TableCell>{t('errorTitle')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.eventId}</TableCell>
              <TableCell>{item.channel}</TableCell>
              <TableCell>
                {t(`notificationDelivery${item.state[0].toUpperCase()}${item.state.slice(1)}`)}
              </TableCell>
              <TableCell>
                <Button onClick={() => showAttempts(item)}>{item.attempts}</Button>
              </TableCell>
              <TableCell>{item.state === 'pending' ? formatDate(item.nextAttempt) : '—'}</TableCell>
              <TableCell>{item.errorCode || '—'}</TableCell>
            </TableRow>
          ))}
          {!items.length && (
            <TableRow>
              <TableCell colSpan={6}>{t('sharedNoData')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Dialog open={history !== null} onClose={() => setHistory(null)} maxWidth="md" fullWidth>
        <DialogTitle>{t('notificationAttempts')}</DialogTitle>
        <DialogContent>
          <Table>
            <TableBody>
              {(history || []).map((attempt) => (
                <TableRow key={attempt.number}>
                  <TableCell>{attempt.number}</TableCell>
                  <TableCell>{formatDate(attempt.startedAt)}</TableCell>
                  <TableCell>{formatDate(attempt.finishedAt)}</TableCell>
                  <TableCell>{attempt.outcome}</TableCell>
                  <TableCell>{attempt.errorCode || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default NotificationDeliveriesPage;
