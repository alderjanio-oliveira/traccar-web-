import { useMemo } from 'react';

export default (t) =>
  useMemo(
    () => ({
      'monitoring.enabled': { name: t('monitoringEnabled'), type: 'boolean' },
      'monitoring.silenceMinutes': { name: t('monitoringSilence'), type: 'number' },
      'monitoring.gpsMinutes': { name: t('monitoringGps'), type: 'number' },
      'monitoring.ignitionMinutes': { name: t('monitoringIgnition'), type: 'number' },
      'monitoring.recovery': { name: t('monitoringRecovery'), type: 'boolean' },
      'monitoring.recoverySeconds': { name: t('monitoringRecoverySeconds'), type: 'number' },
      'command.sender': {
        name: t('deviceCommandSender'),
        type: 'string',
      },
      'web.reportColor': {
        name: t('attributeWebReportColor'),
        type: 'string',
        dataType: 'color',
      },
      devicePassword: {
        name: t('attributeDevicePassword'),
        type: 'string',
      },
      deviceImage: {
        name: t('attributeDeviceImage'),
        type: 'string',
      },
      'processing.copyAttributes': {
        name: t('attributeProcessingCopyAttributes'),
        type: 'string',
      },
      'decoder.timezone': {
        name: t('sharedTimezone'),
        type: 'string',
      },
      'forward.url': {
        name: t('attributeForwardUrl'),
        type: 'string',
      },
    }),
    [t],
  );
