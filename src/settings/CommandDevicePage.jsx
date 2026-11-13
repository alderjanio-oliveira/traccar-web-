import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { messagesActions } from '../store';

const CommandDevicePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  const [savedId, setSavedId] = useState(0);
  const [item, setItem] = useState({});

  const submissionRef = useRef(null);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const handleSend = useCatch(async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      let command;
      if (savedId) {
        const response = await fetchOrThrow(`api/commands/${savedId}`);
        command = await response.json();
      } else {
        command = { ...item };
      }
      command.deviceId = parseInt(id, 10);
      const payload = JSON.stringify(command);
      const signature = `${id}:${payload}`;
      if (submissionRef.current?.signature !== signature) {
        submissionRef.current = { signature, key: crypto.randomUUID() };
      }
      await fetchOrThrow('api/commands/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionRef.current.key,
        },
        body: payload,
      });
      dispatch(
        messagesActions.push({ message: t('commandSubmissionRecorded'), severity: 'success' }),
      );
      navigate(-1);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  });

  const validate = () => savedId || (item && item.type);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <BaseCommandView
              deviceId={id}
              item={item}
              setItem={setItem}
              includeSaved
              savedId={savedId}
              setSavedId={setSavedId}
            />
          </AccordionDetails>
        </Accordion>
        <div className={classes.buttons}>
          <Button type="button" color="primary" variant="outlined" onClick={() => navigate(-1)}>
            {t('sharedCancel')}
          </Button>
          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={handleSend}
            disabled={sending || !validate()}
          >
            {t('commandSend')}
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
};

export default CommandDevicePage;
