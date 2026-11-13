import { useReducer, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { prefixString } from '../common/util/stringUtils';
import PageLayout from '../common/components/PageLayout';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import fetchOrThrow from '../common/util/fetchOrThrow';

const time = (value) => (value ? new Date(value).toLocaleString() : '—');

const CommandHistoryPage = () => {
  const t = useTranslation();
  const [deviceId, setDeviceId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState([]);
  const [reload, refresh] = useReducer((value) => value + 1, 0);
  useAsyncTask(
    async ({ signal }) => {
      void reload;
      setRequests([]);
      setResponses([]);
      if (!deviceId) return;
      const [requestResponse, replyResponse] = await Promise.all([
        fetchOrThrow(`api/devices/${deviceId}/command-history`, { signal }),
        fetchOrThrow(`api/devices/${deviceId}/command-history/responses`, { signal }),
      ]);
      const requestValues = await requestResponse.json();
      const responseValues = await replyResponse.json();
      if (signal.aborted) return;
      setRequests(requestValues);
      setResponses(responseValues);
    },
    [deviceId, reload],
  );
  const state = (value) => t(`commandHistory${value[0].toUpperCase()}${value.slice(1)}`);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'commandHistoryTitle']}>
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
        {t('commandHistoryHelp')}
      </Alert>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('commandHistoryRequestedAt')}</TableCell>
            <TableCell>{t('settingsUser')}</TableCell>
            <TableCell>{t('deviceCommand')}</TableCell>
            <TableCell>{t('deviceStatus')}</TableCell>
            <TableCell>{t('operationsBlockState')}</TableCell>
            <TableCell>{t('commandHistoryEvidence')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{time(request.requestedAt)}</TableCell>
              <TableCell>{request.userId || t('commandHistoryAutomatic')}</TableCell>
              <TableCell>{t(prefixString('command', request.type))}</TableCell>
              <TableCell>
                {state(request.state)}
                {request.errorCode ? ` (${request.errorCode})` : ''}
              </TableCell>
              <TableCell>{state(request.reportedState)}</TableCell>
              <TableCell>{time(request.evidenceTime)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{t('commandHistoryResponses')}</Typography>
      </Box>
      <Alert severity="info" sx={{ mx: 2 }}>
        {t('commandHistoryUncorrelated')}
      </Alert>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('commandHistoryReceivedAt')}</TableCell>
            <TableCell>{t('deviceStatus')}</TableCell>
            <TableCell>{t('commandHistoryResponses')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.map((response) => (
            <TableRow key={response.id}>
              <TableCell>{time(response.receivedAt)}</TableCell>
              <TableCell>{state(response.state)}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {response.response}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default CommandHistoryPage;
