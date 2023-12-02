import { Box, Grid, SxProps, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { GroupPrivacy } from '../../../constants/group.constants';
import { ProposalActionGroupConfigInput } from '../../../graphql/gen';
import { useGroupSettingsByGroupIdLazyQuery } from '../../../graphql/groups/queries/gen/GroupSettingsByGroupId.gen';
import { ProposalActionGroupSettingsFragment } from '../../../graphql/proposals/fragments/gen/ProposalActionGroupSettings.gen';
import { useIsDesktop } from '../../../hooks/shared.hooks';
import Accordion, {
  AccordionDetails,
  AccordionSummary,
} from '../../Shared/Accordion';
import ProposedChange from './ProposedChange';

interface Props {
  groupSettings:
    | ProposalActionGroupSettingsFragment
    | ProposalActionGroupConfigInput;
  groupId?: number | null;
  preview?: boolean;
  ratified?: boolean;
}

const ProposalActionGroupSettings = ({
  groupSettings,
  preview,
  ratified,
  groupId,
}: Props) => {
  const { pathname } = useLocation();
  const isProposalPage = pathname.includes('/proposals/');
  const [showDetails, setShowDetails] = useState(!!preview || isProposalPage);

  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const [getGroupSettings, { data }] = useGroupSettingsByGroupIdLazyQuery();

  useEffect(() => {
    if (preview && groupId) {
      getGroupSettings({ variables: { groupId } });
    }
  }, [groupId, getGroupSettings, preview]);

  const groupSettingsToChange =
    'proposalAction' in groupSettings
      ? groupSettings.proposalAction.proposal.group?.settings
      : data?.group.settings;

  const oldPrivacy =
    ratified && 'oldPrivacy' in groupSettings
      ? groupSettings.oldPrivacy
      : groupSettingsToChange?.privacy;

  const oldStandAsidesLimit =
    ratified && 'oldStandAsidesLimit' in groupSettings
      ? groupSettings.oldStandAsidesLimit
      : groupSettingsToChange?.standAsidesLimit;

  const oldReservationsLimit =
    ratified && 'oldReservationsLimit' in groupSettings
      ? groupSettings.oldReservationsLimit
      : groupSettingsToChange?.reservationsLimit;

  const oldRatificationThreshold =
    ratified && 'oldRatificationThreshold' in groupSettings
      ? groupSettings.oldRatificationThreshold
      : groupSettingsToChange?.ratificationThreshold;

  const isChangingPrivacy =
    groupSettings.privacy && groupSettings.privacy !== oldPrivacy;

  const isChangingStandAsidesLimit =
    !!groupSettings.standAsidesLimit &&
    groupSettings.standAsidesLimit !== oldStandAsidesLimit;

  const isChangingReservationsLimit =
    !!groupSettings.reservationsLimit &&
    groupSettings.reservationsLimit !== oldReservationsLimit;

  const isChangingRatificationThreshold =
    !!groupSettings.ratificationThreshold &&
    groupSettings.ratificationThreshold !== oldRatificationThreshold;

  const accordionStyles: SxProps = {
    backgroundColor: 'rgb(0, 0, 0, 0.1)',
    borderRadius: 2,
    paddingX: 2,
  };

  const getPrivacyLabel = (privacy?: string | null) => {
    if (privacy === GroupPrivacy.Public) {
      return t('groups.labels.public');
    }
    return t('groups.labels.private');
  };

  const getSettingsChanges = () => {
    let settingsChanged = 0;

    if (isChangingPrivacy) {
      settingsChanged += 1;
    }
    if (isChangingStandAsidesLimit) {
      settingsChanged += 1;
    }
    if (isChangingReservationsLimit) {
      settingsChanged += 1;
    }
    if (isChangingRatificationThreshold) {
      settingsChanged += 1;
    }

    return t('proposals.labels.settingChangesCount', {
      count: settingsChanged,
    });
  };

  return (
    <Box marginBottom={preview ? 0 : 2.5} marginTop={preview ? 2 : 0}>
      <Accordion
        expanded={showDetails}
        onChange={() => setShowDetails(!showDetails)}
        sx={accordionStyles}
      >
        <AccordionSummary>
          <Typography marginRight="0.5ch" fontFamily="Inter Bold">
            {isDesktop
              ? t('proposals.labels.proposedGroupSettings')
              : t('proposals.labels.proposedSettings')}
            :
          </Typography>

          <Typography
            display="inline-block"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            width={isDesktop ? '330px' : '130px'}
          >
            {getSettingsChanges()}
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ marginBottom: isDesktop ? 2.5 : 3 }}>
          <Grid
            columns={isDesktop ? 12 : 4}
            columnSpacing={3}
            rowSpacing={1}
            container
          >
            {isChangingRatificationThreshold && (
              <ProposedChange
                label={t('groups.settings.names.ratificationThreshold')}
                proposedValue={`${groupSettings.ratificationThreshold}%`}
                oldValue={`${oldRatificationThreshold}%`}
              />
            )}

            {isChangingStandAsidesLimit && (
              <ProposedChange
                label={t('groups.settings.names.standAsidesLimit')}
                proposedValue={groupSettings.standAsidesLimit}
                oldValue={oldStandAsidesLimit}
              />
            )}

            {isChangingReservationsLimit && (
              <ProposedChange
                label={t('groups.settings.names.reservationsLimit')}
                proposedValue={groupSettings.reservationsLimit}
                oldValue={oldReservationsLimit}
              />
            )}

            {isChangingPrivacy && (
              <ProposedChange
                label={t('groups.settings.names.privacy')}
                proposedValue={getPrivacyLabel(groupSettings.privacy)}
                oldValue={getPrivacyLabel(oldPrivacy)}
              />
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProposalActionGroupSettings;
