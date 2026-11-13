import { useReducer, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material';
import { useAsyncTask, useCatchCallback } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import SearchHeader from './components/SearchHeader';
import fetchOrThrow from '../common/util/fetchOrThrow';

const age = (seconds) => {
  if (seconds == null) return '—';
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(-seconds, 'second');
  if (Math.abs(seconds) < 3600) return formatter.format(-Math.floor(seconds / 60), 'minute');
  if (Math.abs(seconds) < 86400) return formatter.format(-Math.floor(seconds / 3600), 'hour');
  return formatter.format(-Math.floor(seconds / 86400), 'day');
};
const date = (value) => (value ? new Date(value).toLocaleString() : '—');

const OperationsPage = () => {
  const t = useTranslation();
  const readonly = useDeviceReadonly();
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const [reload, refresh] = useReducer((value) => value + 1, 0);
  const [detail, setDetail] = useState(null);
  useAsyncTask(
    async ({ signal }) => {
      void reload;
      const query = new URLSearchParams({ limit: 50, offset, keyword });
      const response = await fetchOrThrow(`api/operations/health?${query}`, { signal });
      setItems(await response.json());
    },
    [offset, keyword, reload],
  );

  const showDetail = useCatchCallback(async (item) => {
    const response = await fetchOrThrow(`api/operations/devices/${item.id}/incidents`);
    setDetail({ item, incidents: await response.json() });
  }, []);
  const label = (key) => t(`operations${key[0].toUpperCase()}${key.slice(1)}`);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'operationsTitle']}>
      <SearchHeader
        keyword={keyword}
        setKeyword={(value) => {
          setKeyword(value);
          setOffset(0);
        }}
      />
      <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography>{t('operationsPageScope')}</Typography>
        <Chip
          label={`${t('deviceStatusOnline')}: ${items.filter((item) => item.diagnostics.communicationStatus === 'online').length}`}
        />
        <Chip
          label={`${t('operationsIncidents')}: ${items.filter((item) => item.activeIncidents.length).length}`}
        />
        <Button onClick={refresh}>{t('notificationRefresh')}</Button>
      </Box>
      <Alert severity="info" sx={{ mx: 2 }}>
        {t('operationsCauseUnconfirmed')}
      </Alert>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('deviceTitle')}</TableCell>
            <TableCell>{t('operationsCommunication')}</TableCell>
            <TableCell>{t('operationsPosition')}</TableCell>
            <TableCell>{t('operationsLastCommunication')}</TableCell>
            <TableCell>{t('operationsIncidents')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={t(
                    `deviceStatus${item.diagnostics.communicationStatus[0].toUpperCase()}${item.diagnostics.communicationStatus.slice(1)}`,
                  )}
                  color={item.diagnostics.communicationStatus === 'online' ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>
                {label(item.diagnostics.positionStatus)} —{' '}
                {age(item.diagnostics.positionAgeSeconds)}
              </TableCell>
              <TableCell>{age(item.diagnostics.communicationAgeSeconds)}</TableCell>
              <TableCell>
                {item.activeIncidents.map((kind) => label(kind)).join(', ') || '—'}
              </TableCell>
              <TableCell>
                <Button onClick={() => showDetail(item)}>{t('operationsDetails')}</Button>
                {!readonly && (
                  <Button component={RouterLink} to={`/settings/device/${item.id}`}>
                    {t('operationsConfigure')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <Button disabled={!offset} onClick={() => setOffset((value) => Math.max(0, value - 50))}>
          {t('operationsPrevious')}
        </Button>
        <Button disabled={items.length < 50} onClick={() => setOffset((value) => value + 50)}>
          {t('operationsNext')}
        </Button>
      </Box>
      <Dialog open={detail !== null} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle>{detail?.item.name}</DialogTitle>
        <DialogContent>
          {detail && (
            <>
              <Typography>
                {t('operationsLastPosition')}: {date(detail.item.diagnostics.lastPosition)}
              </Typography>
              <Typography>
                {t('operationsLastIgnition')}:{' '}
                {detail.item.diagnostics.ignition == null
                  ? '—'
                  : detail.item.diagnostics.ignition
                    ? t('sharedYes')
                    : t('sharedNo')}
              </Typography>
              <Typography>
                {t('operationsMonitoring')}:{' '}
                {detail.item.monitoringEnabled ? t('sharedYes') : t('sharedNo')}
              </Typography>
              <Typography>
                {t('operationsBlockState')}: {detail.item.diagnostics.blockState}
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('operationsIncidents')}</TableCell>
                    <TableCell>{t('operationsOpened')}</TableCell>
                    <TableCell>{t('operationsRecoveredAt')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{label(incident.kind)}</TableCell>
                      <TableCell>{date(incident.openedAt)}</TableCell>
                      <TableCell>{date(incident.recoveredAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default OperationsPage;
