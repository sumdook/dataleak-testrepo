var a = 100;
var b = 200;
var c = 300;
var d = 400;
var e = 500;
var f = 500;
var g = 500;

var g = 500;
var h = 500;
var i = 600;
var j = 700;
var k = 700;
var l = 700;


/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-shadow */
/* eslint-disable no-nested-ternary */
import React, { useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import Tour from 'reactour';
import { useToasts } from 'react-toast-notifications';

import { useQueryCache, useMutation } from 'react-query';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

import {
  Flex,
  Box,
  PseudoBox,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorMode,
  Text,
  Spinner,
  Skeleton,
  Switch,
  Select,
  Modal,
  ModalOverlay,
  ModalContent as MC,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tag,
  Stack,
  Badge
} from '@chakra-ui/core';
import { IconContext } from 'react-icons';
import { FaAngleLeft } from 'react-icons/fa';
import { CgDetailsMore, CgInfo } from 'react-icons/cg';
import { BsArrowsCollapse, BsArrowsExpand } from 'react-icons/bs';

import {
  AiOutlineClockCircle,
  AiOutlineExport,
  AiOutlineCheck,
  AiOutlineArrowRight,
  AiOutlinePushpin,
  AiFillPushpin
} from 'react-icons/ai';
import { IoMdAddCircleOutline } from 'react-icons/io';
import { RiExternalLinkLine } from 'react-icons/ri';
import { GoIssueOpened, GoIssueClosed } from 'react-icons/go';
import { VscDebugDisconnect } from 'react-icons/vsc';

import { AWSIcon, AzureIcon, GoogleIcon } from 'components/icons';

import {
  TeamPicker,
  MutePicker,
  SeverityPicker,
  HoverStyle,
  LabelPicker
} from 'components/pickers';

import RescanIssue from 'components/rescanIssue';
import ActionTrail from 'components/actionTrail';
import CveTable from 'components/cveTable';
import { HoverStyle as BgHoverStyle, SidebarToggle } from 'components/sidebar';

import ConfigItem from 'pages/Settings/components/configItem';

import {
  StyledExternalLink,
  Button as StyledButton,
  Tooltip,
  AlertDialog
} from 'components/primitives';
import Card from 'components/card';

import { useTicket, useTicketMutation } from 'hooks/useTicket';
import useSession from 'hooks/useSession';
import {
  useMuteIssueMutation,
  useUnmuteIssueMutation
} from 'hooks/useMuteMutation';

import { Issue, Session } from 'common/types';
import { moduleEntityMapping, monthNames } from 'common/values';

import API from 'helpers/api';
import { capitalize } from 'common/functions';

const ModalContent = motion.custom(MC);

type Entity = {
  name: string;
  new: boolean;
  url: string;
  provider?: string;
};

export type IssuePageProps = {
  breadcrumbs: { name?: string; link: string | null }[];
  isIssueLoading: boolean;
  issue?: Issue;
};

const tourStyle = {
  color: '#fff',
  backgroundColor: '#1f2023',
  border: '1px solid #303236',
  padding: '40px 40px 20px 40px',
  minWidth: '360px'
};

const MIN_SHOWN_PLUGINS = 3;

const IssuePageLayout: React.FC<IssuePageProps> = ({
  breadcrumbs,
  children,
  issue,
  isIssueLoading
}) => {
  const { colorMode } = useColorMode();
  const {
    issueId,
    accountId,
    domainId,
    mobileAppId,
    leakMonitoringId
  } = useParams<{
    issueId: string;
    accountId?: string;
    domainId?: string;
    mobileAppId?: string;
    leakMonitoringId?: string;
  }>();
  const location = useLocation();
  const { data: sessionData } = useSession();
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [showMoreConfig, setShowMoreConfig] = useState(false);

  const scrollDiv = useRef<HTMLElement>(null);

  const backLink = breadcrumbs[0].link;
  const urlHasTour = Boolean(new URLSearchParams(location.search).get('tour'));
  const shouldBegintour =
    !localStorage.getItem('issue-page-tour') || urlHasTour;

  const isAllIssues =
    !accountId && !domainId && !mobileAppId && !leakMonitoringId;

  const pluginConfigUrl = `/settings/config/${
    issue?.plugin.module === 'CLOUD_MONITORING'
      ? issue.plugin.provider
      : issue?.plugin.module === 'DOMAIN_MONITORING'
      ? issue.plugin.service
      : issue?.plugin.module === 'MOBILE_SECURITY'
      ? 'MOBILE_SECURITY'
      : 'DATA_LEAK_MONITORING'
  }?pluginId=${issue?.plugin.pluginId}`;

  const getEntityList = (): Entity[] => {
    if (issue && sessionData) {
      if (issue?.plugin.module === 'CLOUD_MONITORING') {
        return sessionData.accounts
          .filter(({ accountId }) =>
            issue.accounts
              ?.map(({ accountId }) => accountId)
              .includes(accountId)
          )
          .map(({ title, accountId, provider }) => ({
            provider,
            name: title,
            new: false,
            url: `/cloud/${accountId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DOMAIN_MONITORING') {
        return sessionData.domains
          .filter(({ domainId }) =>
            issue.domains?.map(({ domainId }) => domainId).includes(domainId)
          )
          .map(({ domain, domainId }) => ({
            name: domain,
            new: false,
            url: `/asset/${domainId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'MOBILE_SECURITY') {
        return sessionData.mobileApps
          .filter(({ mobileAppId }) =>
            issue.mobileApps
              ?.map(({ mobileAppId }) => mobileAppId)
              .includes(mobileAppId)
          )
          .map(({ title, mobileAppId }) => ({
            name: title,
            new: false,
            url: `/mobile/${mobileAppId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DATA_LEAK_MONITORING') {
        return sessionData.leakMonitorings
          .filter(({ leakMonitoringId }) =>
            issue.leakMonitorings
              ?.map(({ leakMonitoringId }) => leakMonitoringId)
              .includes(leakMonitoringId)
          )
          .map(({ title, leakMonitoringId }) => ({
            name: title,
            new: false,
            url: `/dataleak/${leakMonitoringId}/issues/${issueId}`
          }));
      }
    }
    return [];
  };

  const tourSteps = [
    {
      selector: '[data-tour="information"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Quick Page Tour
          </Text>
          <Text mb={2}>
            Find all the relevant information about the issue and the steps to
            fix it here
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(issue?.plugin.service === 'PATCHING_CADENCE'
      ? [
          {
            selector: '[data-tour="cve-table"]',
            content:
              'Here is the list of affected CVEs along with the description and severity',
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="plugin-config"]',
      content: () => (
        <>
          <Text mb={2}>
            For issues related to cloud governance you can manage the issue
            configuration as per your needs. You can also access{' '}
            <StyledExternalLink href={pluginConfigUrl} target="_blank">
              PingSafe Security Hub
            </StyledExternalLink>{' '}
            from Settings to manage this at any point
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(isAllIssues
      ? [
          {
            selector: '[data-tour="entities"]',
            content: `Here is a list of the affected ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }s for this issue. You can click on the any of them to check all active issues for that ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }`,
            style: tourStyle
          }
        ]
      : []),

    ...((issue?.resources || []).length > 0
      ? [
          {
            selector: '[data-tour="resource-table"]',
            content: () => (
              <>
                <Text mb={2}>
                  Find the list of affected resources, you can select resources
                  to perform various operations
                </Text>
              </>
            ),
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="activity"]',
      content: 'Here is the audit trail of the issue',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="comment-box"]',
      content: 'You can collaborate with the team from here',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="actions"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Actions
          </Text>
          <Text mb={2}>
            You can change the{' '}
            <Box as="span" fontWeight={600}>
              severity
            </Box>{' '}
            of the issue,{' '}
            <Box as="span" fontWeight={600}>
              assign
            </Box>{' '}
            it to team members, or{' '}
            <Box as="span" fontWeight={600}>
              mute
            </Box>{' '}
            it as necessary
          </Text>
        </>
      ),
      style: tourStyle
    },
    {
      selector: '[data-tour="mute-entity"]',
      content: `You can suppress the issue for a particular ${
        moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
      } if needed`,
      style: tourStyle
    },
    {
      selector: '[data-tour="integrations"]',
      content:
        'You can create Jira ticket or PagerDuty incident for the issue from here. Optionally, manage integrations from the settings',
      style: tourStyle
    },
    // {
    //   selector: '[data-tour="pin"]',
    //   content: () => (
    //     <Text mb={2}>
    //       You can{' '}
    //       <Box as="span" fontWeight={600}>
    //         Bookmark
    //       </Box>{' '}
    //       the issue to track it closely on the Analytics page
    //     </Text>
    //   ),
    //   style: tourStyle
    // },
    {
      selector: '[data-tour="actions-two"]',
      content: () => (
        <>
          <Text mb={2}>
            <Box as="span" fontWeight={600}>
              Export
            </Box>{' '}
            the issue in PDF or CSV format.
          </Text>
          <Text mb={2}>
            PingSafe automatically marks the issue as resolved once it is fixed.
            Optionally,{' '}
            <Box as="span" fontWeight={600}>
              resolve
            </Box>{' '}
            the issue manually.
          </Text>
          {issue?.plugin.module === 'CLOUD_MONITORING' && (
            <Text mb={2}>
              PingSafe continuously monitors the cloud for any changes.
              Alternatively, run a{' '}
              <Box as="span" fontWeight={600}>
                rescan
              </Box>{' '}
              manually.
            </Text>
          )}
        </>
      ),
      style: tourStyle
    }
  ];

  return !issue ? (
    <IssuePageSkeleton breadcrumbs={breadcrumbs} />
  ) : (
    <Flex width="100%">
      {shouldBegintour && (
        <Tour
          onRequestClose={() => {
            localStorage.setItem('issue-page-tour', 'done');
            setIsTourOpen(false);
          }}
          onAfterOpen={() => {
            disableBodyScroll(document.body);
            disableBodyScroll(scrollDiv.current || document.body);
          }}
          onBeforeClose={() => {
            enableBodyScroll(document.body);
            enableBodyScroll(scrollDiv.current || document.body);
          }}
          disableInteraction={false}
          disableFocusLock={false}
          steps={tourSteps}
          isOpen={isTourOpen}
          rounded={5}
          showNavigationNumber={false}
          closeWithMask={false}
        />
      )}
      <Box
        width={['100%', '100%', isCollapsed ? '100%' : 'calc(100% - 400px)']}
        overflow="hidden"
        height="100vh"
        position="relative"
      >
        <Flex
          px={4}
          py={2}
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
            <Breadcrumb>
              {breadcrumbs.map(({ name, link }) => {
                return (
                  <BreadcrumbItem key={name} isCurrentPage={!link}>
                    {link ? (
                      // @ts-ignore
                      <BreadcrumbLink as={Link} to={link}>
                        {name}
                      </BreadcrumbLink>
                    ) : (
                      <Text
                        maxW="500px"
                        overflow="hidden"
                        style={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {name}
                      </Text>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </Breadcrumb>
          </Flex>
          <Flex alignItems="center">
            {/* <PinIssue
              issue={issue}
              colorMode={colorMode}
              isIssueLoading={isIssueLoading}
            /> */}
            <Box display={['block', 'block', 'none']}>
              <BgHoverStyle
                onClick={() => setShowDetails(!showDetails)}
                colorMode={colorMode}
                variant="bg"
                active={showDetails}
              >
                <Box as={CgDetailsMore} fontSize="18px" />
              </BgHoverStyle>
            </Box>
            <Tooltip
              label={isCollapsed ? 'Expand' : 'Collapse'}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Box display={['none', 'none', 'block']}>
                <BgHoverStyle
                  onClick={() => setCollapsed(!isCollapsed)}
                  colorMode={colorMode}
                  variant="bg"
                  active={showDetails}
                >
                  <Box
                    as={isCollapsed ? BsArrowsExpand : BsArrowsCollapse}
                    transform="rotate(90deg)"
                    fontSize="18px"
                  />
                </BgHoverStyle>
              </Box>
            </Tooltip>
          </Flex>
        </Flex>

        <Box
          position="absolute"
          width="400px"
          height="calc(100vh - 56px)"
          bottom={0}
          right={0}
          bg={`bg.secondary.${colorMode}`}
          p={5}
          display={['block', 'block', 'none']}
          transform={
            showDetails
              ? 'translate3d(0px,0px,0px)'
              : 'translate3d(400px,0,0px)'
          }
          transition="0.1s transform ease-out"
          boxShadow={`box.${colorMode}`}
          zIndex={9999}
        >
          {showDetails && (
            <IssueDetails
              issue={issue}
              issueId={issueId}
              colorMode={colorMode}
              sessionData={sessionData}
            />
          )}
        </Box>
        <Box
          width="100%"
          height="calc(100vh - 56px)"
          overflowY="scroll"
          ref={scrollDiv}
        >
          <Box py={5}>
            <Box pl="52px" pr={8}>
              <Box data-tour="information">
                <Text fontSize={20} fontWeight="500">
                  <span dangerouslySetInnerHTML={{ __html: issue.message }} />
                </Text>
                {issue.plugin.version === 'v2' && (
                  <Flex alignItems="center" fontSize="12px" color="blue.400">
                    <Box as={CgInfo} mr={1} />
                    <Text>
                      This issue was detected by a recently added plugin
                    </Text>
                  </Flex>
                )}
                <Text fontSize={16} fontWeight="500" mt={4}>
                  Description
                </Text>
                {issue?.plugin.description && (
                  <Text fontSize={14} mb={4}>
                    {issue?.plugin.description}
                  </Text>
                )}

                {issue?.plugin.impact && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Impact
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.impact}
                    </Text>
                  </Box>
                )}

                {/* {issue?.meta &&
                  Object.keys(issue.meta).map(key => {
                    if (issue.meta && typeof issue.meta[key] === 'string') {
                      return (
                        <>
                          <Text fontSize={16} fontWeight="500" mt={2}>
                            {key.toUpperCase()}
                          </Text>
                          <Text fontSize={14} mb={2}>
                            <span />
                            {issue.meta[key]}
                          </Text>
                        </>
                      );
                    }
                    return undefined;
                  })} */}
                {issue?.plugin.recommendedAction && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Recommended Action
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.recommendedAction}
                    </Text>
                  </Box>
                )}

                {issue?.plugin.infoLink && (
                  <Box mb={4}>
                    <StyledExternalLink
                      href={issue?.plugin.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Flex alignItems="center">
                        Read more about the issue{' '}
                        <Box
                          as={AiOutlineArrowRight}
                          ml={1}
                          fontSize={12}
                          mt="2px"
                        />
                      </Flex>
                    </StyledExternalLink>
                  </Box>
                )}
              </Box>
            </Box>
            {issue?.plugin.service === 'PATCHING_CADENCE' &&
              issue?.meta &&
              Array.isArray(issue.meta.vulnerabilities) && (
                <>
                  <div data-tour="cve-table">
                    <Text fontWeight={500} mb={3} marginLeft="52px">
                      Relevant CVEs
                    </Text>
                    <CveTable data={issue.meta.vulnerabilities} />
                  </div>
                </>
              )}
            <Box pl="52px" pr={8}>
              <Box data-tour="plugin-config">
                <Card colorMode={colorMode}>
                  <Flex alignItems="center" mb={4}>
                    <Text fontWeight="500" fontSize="18px" mb={1}>
                      Plugin Configuration
                    </Text>
                    {issue.plugin.version === 'v2' && (
                      <Badge variantColor="green" ml={2} mb={1}>
                        New
                      </Badge>
                    )}
                  </Flex>
                  {Object.keys(
                    issue.plugin.config || issue.plugin.configuration
                  ).length > 0 ? (
                    <>
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      )
                        .slice(0, MIN_SHOWN_PLUGINS)
                        .map(key => {
                          return (
                            <ConfigItem
                              configKey={key}
                              pluginId={issue.plugin.pluginId}
                              muted={false}
                              issueId={issueId}
                              urlPrefix={
                                issue.plugin.config ? 'config' : 'configuration'
                              }
                              {...(issue.plugin.config ||
                                issue.plugin.configuration)[key]}
                            />
                          );
                        })}
                      {showMoreConfig &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        ).length > MIN_SHOWN_PLUGINS &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        )
                          .slice(MIN_SHOWN_PLUGINS)
                          .map(key => {
                            return (
                              <ConfigItem
                                configKey={key}
                                pluginId={issue.plugin.pluginId}
                                muted={false}
                                issueId={issueId}
                                urlPrefix={
                                  issue.plugin.config
                                    ? 'config'
                                    : 'configuration'
                                }
                                {...(issue.plugin.config ||
                                  issue.plugin.configuration)[key]}
                              />
                            );
                          })}
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      ).length > MIN_SHOWN_PLUGINS && (
                        <Flex
                          w="100%"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <StyledButton
                            colorMode={colorMode}
                            onClick={() => setShowMoreConfig(!showMoreConfig)}
                          >
                            {showMoreConfig
                              ? 'Show less'
                              : `Show ${
                                  Object.keys(
                                    issue.plugin.config ||
                                      issue.plugin.configuration
                                  ).slice(MIN_SHOWN_PLUGINS).length
                                } more`}
                          </StyledButton>
                        </Flex>
                      )}
                    </>
                  ) : (
                    <Text
                      width="100%"
                      fontSize="13px"
                      color={`subtle.${colorMode}`}
                      textAlign="center"
                      my={8}
                    >
                      No configurable parameters for this plugin
                    </Text>
                  )}
                </Card>
              </Box>
              {isAllIssues && (
                <Box data-tour="entities" mb={8}>
                  <Text fontSize={16} fontWeight="500">
                    Affected{' '}
                    {capitalize(moduleEntityMapping[issue.plugin.module])}s
                  </Text>
                  <Flex alignContent="space-between" flexWrap="wrap" mt={1}>
                    {getEntityList().map(({ name, url, provider }) => (
                      <Link to={url} key={name}>
                        <Tag size="sm" my={1} mr={2} fontSize="13px">
                          <Flex alignItems="center" pb="2px">
                            {provider === 'AWS' && (
                              <Box mr={2} mt="4px">
                                <AWSIcon colorMode={colorMode} size={18} />
                              </Box>
                            )}
                            {provider === 'AZURE' && (
                              <Box mr={2} mt="2px">
                                <AzureIcon size={14} />
                              </Box>
                            )}
                            {provider === 'GOOGLE' && (
                              <Box mr={2} mt="2px">
                                <GoogleIcon size={14} />
                              </Box>
                            )}
                            <Text>{name}</Text>
                          </Flex>
                        </Tag>
                      </Link>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
            <Text fontWeight={500} mt={4} marginLeft="52px">
              Affected Resources
            </Text>
            <Box py={issue.resources.length === 0 ? 8 : 0}>{children}</Box>
          </Box>
          <Box
            // width="calc(100%-64px)"
            width="100%"
            borderWidth="1px"
            borderColor={`border.${colorMode}`}
            // mx="32px"
          />
          <Box mx="52px" py={5} data-tour="activity">
            <ActionTrail
              issueId={issue.id}
              accountId={accountId}
              domainId={domainId}
              mobileAppId={mobileAppId}
              leakMonitoringId={leakMonitoringId}
            />
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        display={['none', 'none', isCollapsed ? 'none' : 'block']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      >
        <IssueDetails
          issue={issue}
          issueId={issueId}
          colorMode={colorMode}
          sessionData={sessionData}
        />
      </Box>
    </Flex>
  );
};

export type IssueDetailsProps = {
  issueId: string;
  issue: Issue;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};

const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  issueId,
  colorMode,
  sessionData
}) => {
  return (
    <>
      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        pb={3}
      >
        <Stack
          isInline
          justifyContent={
            issue.plugin.module === 'CLOUD_MONITORING'
              ? 'space-around'
              : 'space-between'
          }
          spacing={10}
          width="100%"
          data-tour="actions-two"
        >
          <ExportIssue colorMode={colorMode} issueId={issueId} />

          <ResolveIssue
            colorMode={colorMode}
            issueId={issueId}
            status={issue.status}
          />
          {issue.plugin.module === 'CLOUD_MONITORING' ? (
            <RescanIssue colorMode={colorMode} issue={issue} />
          ) : (
            <Box width="72px" />
          )}
        </Stack>
      </Box>

      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        py={4}
        ml={2}
      >
        <ActionBarItem label="Status" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={issue.status === 'OPEN' ? GoIssueOpened : GoIssueClosed}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {issue.status}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Discovered" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue?.creationTime).getDate()}{' '}
              {monthNames[new Date(issue?.creationTime || 0).getMonth()]}{' '}
              {new Date(issue?.creationTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Updated" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue.refreshTime).getDate()}{' '}
              {monthNames[new Date(issue.refreshTime || 0).getMonth()]}{' '}
              {new Date(issue.refreshTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>
        <div data-tour="actions">
          <ActionBarItem label="Severity" colorMode={colorMode} small>
            <SeverityPicker
              variant="page"
              severity={issue.severity}
              issueId={issueId}
            />
          </ActionBarItem>

          <ActionBarItem
            label="Assignees"
            colorMode={colorMode}
            small
            dataTour="assignees"
          >
            <TeamPicker
              variant="page"
              assigneeIds={issue?.assignees || []}
              issueId={issueId}
            />
          </ActionBarItem>
          <Flex width="100%">
            <Text
              width="120px"
              color={`label.${colorMode}`}
              fontSize="13px"
              mt="10px"
            >
              Add Label
            </Text>
            <Flex alignItems="center" ml="20px">
              <LabelPicker
                issueId={issueId}
                labelIds={issue.labels.map(label => label.labelId)}
              />
            </Flex>
          </Flex>
          <ActionBarItem
            label="Mute Issue"
            colorMode={colorMode}
            dataTour="mute-issue"
          >
            <Flex alignItems="center" ml="23px">
              <IssueMute issue={issue} />
            </Flex>
          </ActionBarItem>
        </div>

        <div data-tour="mute-entity">
          {issue.accounts && issue.accounts.length !== 0 && (
            <ActionBarItem label="Muted Accounts" colorMode={colorMode} small>
              <MutePicker
                accounts={issue.accounts}
                mutedIds={issue.accounts
                  .filter(({ muted }) => muted)
                  .map(({ accountId }) => accountId)}
                issueId={issueId}
                disabled={issue.muted}
              />
            </ActionBarItem>
          )}
          {issue.domains && issue.domains.length !== 0 && (
            <ActionBarItem label="Muted Domains" colorMode={colorMode} small>
              <MutePicker
                domains={issue.domains}
                mutedIds={issue.domains
                  .filter(({ muted }) => muted)
                  .map(({ domainId }) => domainId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
          {issue.mobileApps && issue.mobileApps.length !== 0 && (
            <ActionBarItem label="Muted Apps" colorMode={colorMode} small>
              <MutePicker
                mobileApps={issue.mobileApps}
                mutedIds={issue.mobileApps
                  .filter(({ muted }) => muted)
                  .map(({ mobileAppId }) => mobileAppId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
        </div>
      </Box>
      <TicketManager
        sessionData={sessionData}
        issueId={issueId}
        colorMode={colorMode}
      />
    </>
  );
};

export type ActionBarItemProps = {
  label: string;
  colorMode: 'light' | 'dark';
  small?: boolean;
  dataTour?: string;
};
export const ActionBarItem: React.FC<ActionBarItemProps> = ({
  label,
  children,
  colorMode,
  small,
  dataTour
}) => {
  return (
    <Flex
      width="100%"
      py={small ? 1 : 3}
      alignItems="center"
      data-tour={dataTour}
    >
      <Text width="120px" color={`label.${colorMode}`} fontSize="13px">
        {label}
      </Text>

      {children}
    </Flex>
  );
};

export type TicketManagerProps = {
  issueId: string;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};
export const TicketManager: React.FC<TicketManagerProps> = ({
  colorMode,
  issueId,
  sessionData
}) => {
  const { data: ticketData, isLoading: isTicketLoading } = useTicket(issueId);
  const [ticketMutate] = useTicketMutation();
  const [loading, setLoading] = useState({
    JIRA: false,
    PAGER_DUTY: false,
    WEBHOOK: false
  });
  const queryCache = useQueryCache();
  const { addToast } = useToasts();

  const hasJiraIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'JIRA'
  );
  const hasPagerDutyIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'PAGER_DUTY'
  );
  const hasWebhookIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'WEBHOOK'
  );
  const handleClick = async (channel: 'JIRA' | 'PAGER_DUTY' | 'WEBHOOK') => {
    try {
      setLoading({ ...loading, [channel]: true });
      await ticketMutate({ channel, issues: [issueId] });
      await queryCache.invalidateQueries(['ticket', issueId]);
      setLoading({ ...loading, [channel]: false });
      if (channel === 'WEBHOOK') {
        addToast('Issue event successfully sent to webhook.', {
          appearance: 'success'
        });
      }
    } catch (e) {
      setLoading({ ...loading, [channel]: false });
    }
  };

  return sessionData ? (
    <Box
      data-tour="integrations"
      width="100%"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor={`border.${colorMode}`}
      py={4}
      ml={2}
    >
      <ActionBarItem label="Jira" colorMode={colorMode}>
        {isTicketLoading || loading.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.JIRA.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.JIRA.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasJiraIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('JIRA')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create ticket
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/jira"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      <ActionBarItem label="PagerDuty" colorMode={colorMode}>
        {isTicketLoading || loading.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.PAGER_DUTY.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.PAGER_DUTY.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasPagerDutyIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('PAGER_DUTY')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create Incident
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/pagerduty"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      {hasWebhookIntegration && (
        <ActionBarItem label="Webhook" colorMode={colorMode}>
          {isTicketLoading || loading.WEBHOOK ? (
            <Flex alignItems="center" ml="12px">
              <Spinner size="xs" my={3} ml={2} />
            </Flex>
          ) : (
            <StyledButton
              onClick={() => handleClick('WEBHOOK')}
              colorMode={colorMode}
              ml="16px"
            >
              Trigger Event
            </StyledButton>
          )}
        </ActionBarItem>
      )}
    </Box>
  ) : (
    <Flex my={10} ml={32}>
      <Spinner size="md" />
    </Flex>
  );
};

const IssueMute: React.FC<{ issue: Issue }> = ({ issue }) => {
  const [muteMutate] = useMuteIssueMutation(issue.id);
  const [unmuteMutate] = useUnmuteIssueMutation(issue.id);

  const handleIssueMute = () => {
    if (issue.muted) {
      unmuteMutate({ issues: [issue.id] });
    } else {
      muteMutate({ issues: [issue.id] });
    }
  };
  return (
    <>
      <Switch size="sm" isChecked={issue.muted} onChange={handleIssueMute} />
      <Text fontSize="13px" ml={3}>
        {issue.muted ? 'Issue muted' : 'Issue not muted'}
      </Text>
    </>
  );
};

type FormData = {
  format: string;
};

const ExportIssue: React.FC<{
  issueId: string;
  colorMode: string;
}> = ({ issueId, colorMode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleSubmit, register, formState } = useForm<FormData>();
  const { addToast } = useToasts();

  const onExport = async ({ format }: FormData) => {
    try {
      await API.post(
        `/issues/export`,
        {
          issues: [issueId],
          format
        },
        { ...(format === 'pdf' && { responseType: 'blob' }) }
      );
      onClose();
      addToast('The report will be emailed to you in 10-15 mins.', {
        appearance: 'success'
      });
    } catch (e) {
      console.log(e);
    }
    onClose();
  };
  return (
    <>
      <Button
        data-tour="export"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        onClick={onOpen}
      >
        <IconContext.Provider
          value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
        >
          <Box as={AiOutlineExport} mr={2} fontSize="14px" />
        </IconContext.Provider>
        Export
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          key="modal"
          initial={{
            opacity: 0.9,
            scale: 0.98,
            perspective: '0px',
            perspectiveOrigin: '50% 249.32px'
          }}
          animate={{ scale: 1.05, opacity: 1, perspective: '110px' }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          <ModalHeader
            mb={2}
            borderBottomWidth="1px"
            borderBottomColor={`border.${colorMode}`}
          >
            Export Issue
          </ModalHeader>
          <form onSubmit={handleSubmit(onExport)}>
            <ModalBody>
              <Box minH="70px" width="100%">
                <Flex
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={4}
                >
                  <Text color={`label.${colorMode}`} fontWeight={500}>
                    Format
                  </Text>
                  <Select
                    size="sm"
                    name="format"
                    defaultValue="csv"
                    width="150px"
                    ref={register}
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </Select>
                </Flex>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                variantColor="primary"
                mr={3}
                size="sm"
                type="submit"
                isLoading={formState.isSubmitting}
              >
                Export
              </Button>
              <Button size="sm" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

const ResolveIssue: React.FC<{
  issueId: string;
  colorMode: string;
  status: string;
}> = ({ issueId, colorMode, status }) => {
  const queryCache = useQueryCache();
  const [isOpen, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);

  const resolveIssue = async () => {
    await API.put(`/issues/resolve`, {
      issues: [issueId]
    });
  };
  const [mutate, { isLoading }] = useMutation(resolveIssue, {
    onSuccess: async () => {
      // queryCache.invalidateQueries(['issues']);
      queryCache.invalidateQueries(['issue', issueId]);
      queryCache.invalidateQueries(['actionTrail', issueId]);
    }
  });
  return (
    <>
      <Button
        data-tour="resolve"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        isDisabled={status !== 'OPEN'}
        onClick={() => setOpen(true)}
      >
        {isLoading ? (
          <>
            <Spinner size="xs" mr={2} /> Resolving...
          </>
        ) : (
          <>
            <IconContext.Provider
              value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
            >
              <Box as={AiOutlineCheck} mr={2} fontSize="16px" />
            </IconContext.Provider>
            {status === 'OPEN' ? 'Resolve' : 'Resolved'}
          </>
        )}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        headerText="Resolve Issues"
        bodyText="Are you sure you want to mark this issue as resolved?"
        actionButtonColor="green"
        actionButtonText="Resolve"
        onConfirm={() => {
          mutate();
          setOpen(false);
        }}
      />
    </>
  );
};

const PinIssue: React.FC<{
  issue: Issue;
  colorMode: string;
  isIssueLoading: boolean;
}> = ({ issue, colorMode, isIssueLoading }) => {
  const queryCache = useQueryCache();
  const pinIssue = async () => {
    await API.put(`/issues/pin`, {
      issues: [issue.id]
    });
  };
  const unpinIssue = async () => {
    await API.put(`/issues/unpin`, {
      issues: [issue.id]
    });
  };
  const [pinMutate, { isLoading: isPinLoading }] = useMutation(pinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  const [unpinMutate, { isLoading: isUnpinLoading }] = useMutation(unpinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  return (
    <Tooltip label="Pin Issue" aria-label="Pin Issue">
      <Box width="40px" mr={1} data-tour="pin">
        {(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <BgHoverStyle colorMode={colorMode} variant="bg">
            <Spinner size="sm" my="1px" />
          </BgHoverStyle>
        )}
        {!(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <Box onClick={() => (issue.pinned ? unpinMutate() : pinMutate())}>
            <BgHoverStyle colorMode={colorMode} variant="bg">
              {issue.pinned ? (
                <Box as={AiFillPushpin} fontSize="18px" />
              ) : (
                <Box as={AiOutlinePushpin} fontSize="18px" />
              )}
            </BgHoverStyle>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

const IssuePageSkeleton: React.FC<{
  breadcrumbs: { name?: string; link: string | null }[];
}> = ({ breadcrumbs }) => {
  const { colorMode } = useColorMode();
  const backLink = breadcrumbs[0].link;

  return (
    <Flex width="100%">
      <Box
        width={['100%', '100%', 'calc(100% - 400px)']}
        height="100vh"
        overflowY="scroll"
      >
        <Flex
          p={4}
          alignItems="center"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
          </Flex>
          <Breadcrumb>
            {breadcrumbs.map(({ name, link }, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <BreadcrumbItem key={index} isCurrentPage={!link}>
                  {link ? (
                    // @ts-ignore
                    <BreadcrumbLink as={Link} to={link}>
                      {name}
                    </BreadcrumbLink>
                  ) : (
                    <Text
                      maxW="500px"
                      overflow="hidden"
                      style={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {name}
                    </Text>
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </Flex>

        <Box pl="52px" mb={4}>
          <Box maxW="600px">
            <Skeleton>
              <Text fontSize={20} fontWeight="500" my={10}>
                Test
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>

            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      />
    </Flex>
  );
};

export default IssuePageLayout;


/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-shadow */
/* eslint-disable no-nested-ternary */
import React, { useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import Tour from 'reactour';
import { useToasts } from 'react-toast-notifications';

import { useQueryCache, useMutation } from 'react-query';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

import {
  Flex,
  Box,
  PseudoBox,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorMode,
  Text,
  Spinner,
  Skeleton,
  Switch,
  Select,
  Modal,
  ModalOverlay,
  ModalContent as MC,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tag,
  Stack,
  Badge
} from '@chakra-ui/core';
import { IconContext } from 'react-icons';
import { FaAngleLeft } from 'react-icons/fa';
import { CgDetailsMore, CgInfo } from 'react-icons/cg';
import { BsArrowsCollapse, BsArrowsExpand } from 'react-icons/bs';

import {
  AiOutlineClockCircle,
  AiOutlineExport,
  AiOutlineCheck,
  AiOutlineArrowRight,
  AiOutlinePushpin,
  AiFillPushpin
} from 'react-icons/ai';
import { IoMdAddCircleOutline } from 'react-icons/io';
import { RiExternalLinkLine } from 'react-icons/ri';
import { GoIssueOpened, GoIssueClosed } from 'react-icons/go';
import { VscDebugDisconnect } from 'react-icons/vsc';

import { AWSIcon, AzureIcon, GoogleIcon } from 'components/icons';

import {
  TeamPicker,
  MutePicker,
  SeverityPicker,
  HoverStyle,
  LabelPicker
} from 'components/pickers';

import RescanIssue from 'components/rescanIssue';
import ActionTrail from 'components/actionTrail';
import CveTable from 'components/cveTable';
import { HoverStyle as BgHoverStyle, SidebarToggle } from 'components/sidebar';

import ConfigItem from 'pages/Settings/components/configItem';

import {
  StyledExternalLink,
  Button as StyledButton,
  Tooltip,
  AlertDialog
} from 'components/primitives';
import Card from 'components/card';

import { useTicket, useTicketMutation } from 'hooks/useTicket';
import useSession from 'hooks/useSession';
import {
  useMuteIssueMutation,
  useUnmuteIssueMutation
} from 'hooks/useMuteMutation';

import { Issue, Session } from 'common/types';
import { moduleEntityMapping, monthNames } from 'common/values';

import API from 'helpers/api';
import { capitalize } from 'common/functions';

const ModalContent = motion.custom(MC);

type Entity = {
  name: string;
  new: boolean;
  url: string;
  provider?: string;
};

export type IssuePageProps = {
  breadcrumbs: { name?: string; link: string | null }[];
  isIssueLoading: boolean;
  issue?: Issue;
};

const tourStyle = {
  color: '#fff',
  backgroundColor: '#1f2023',
  border: '1px solid #303236',
  padding: '40px 40px 20px 40px',
  minWidth: '360px'
};

const MIN_SHOWN_PLUGINS = 3;

const IssuePageLayout: React.FC<IssuePageProps> = ({
  breadcrumbs,
  children,
  issue,
  isIssueLoading
}) => {
  const { colorMode } = useColorMode();
  const {
    issueId,
    accountId,
    domainId,
    mobileAppId,
    leakMonitoringId
  } = useParams<{
    issueId: string;
    accountId?: string;
    domainId?: string;
    mobileAppId?: string;
    leakMonitoringId?: string;
  }>();
  const location = useLocation();
  const { data: sessionData } = useSession();
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [showMoreConfig, setShowMoreConfig] = useState(false);

  const scrollDiv = useRef<HTMLElement>(null);

  const backLink = breadcrumbs[0].link;
  const urlHasTour = Boolean(new URLSearchParams(location.search).get('tour'));
  const shouldBegintour =
    !localStorage.getItem('issue-page-tour') || urlHasTour;

  const isAllIssues =
    !accountId && !domainId && !mobileAppId && !leakMonitoringId;

  const pluginConfigUrl = `/settings/config/${
    issue?.plugin.module === 'CLOUD_MONITORING'
      ? issue.plugin.provider
      : issue?.plugin.module === 'DOMAIN_MONITORING'
      ? issue.plugin.service
      : issue?.plugin.module === 'MOBILE_SECURITY'
      ? 'MOBILE_SECURITY'
      : 'DATA_LEAK_MONITORING'
  }?pluginId=${issue?.plugin.pluginId}`;

  const getEntityList = (): Entity[] => {
    if (issue && sessionData) {
      if (issue?.plugin.module === 'CLOUD_MONITORING') {
        return sessionData.accounts
          .filter(({ accountId }) =>
            issue.accounts
              ?.map(({ accountId }) => accountId)
              .includes(accountId)
          )
          .map(({ title, accountId, provider }) => ({
            provider,
            name: title,
            new: false,
            url: `/cloud/${accountId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DOMAIN_MONITORING') {
        return sessionData.domains
          .filter(({ domainId }) =>
            issue.domains?.map(({ domainId }) => domainId).includes(domainId)
          )
          .map(({ domain, domainId }) => ({
            name: domain,
            new: false,
            url: `/asset/${domainId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'MOBILE_SECURITY') {
        return sessionData.mobileApps
          .filter(({ mobileAppId }) =>
            issue.mobileApps
              ?.map(({ mobileAppId }) => mobileAppId)
              .includes(mobileAppId)
          )
          .map(({ title, mobileAppId }) => ({
            name: title,
            new: false,
            url: `/mobile/${mobileAppId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DATA_LEAK_MONITORING') {
        return sessionData.leakMonitorings
          .filter(({ leakMonitoringId }) =>
            issue.leakMonitorings
              ?.map(({ leakMonitoringId }) => leakMonitoringId)
              .includes(leakMonitoringId)
          )
          .map(({ title, leakMonitoringId }) => ({
            name: title,
            new: false,
            url: `/dataleak/${leakMonitoringId}/issues/${issueId}`
          }));
      }
    }
    return [];
  };

  const tourSteps = [
    {
      selector: '[data-tour="information"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Quick Page Tour
          </Text>
          <Text mb={2}>
            Find all the relevant information about the issue and the steps to
            fix it here
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(issue?.plugin.service === 'PATCHING_CADENCE'
      ? [
          {
            selector: '[data-tour="cve-table"]',
            content:
              'Here is the list of affected CVEs along with the description and severity',
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="plugin-config"]',
      content: () => (
        <>
          <Text mb={2}>
            For issues related to cloud governance you can manage the issue
            configuration as per your needs. You can also access{' '}
            <StyledExternalLink href={pluginConfigUrl} target="_blank">
              PingSafe Security Hub
            </StyledExternalLink>{' '}
            from Settings to manage this at any point
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(isAllIssues
      ? [
          {
            selector: '[data-tour="entities"]',
            content: `Here is a list of the affected ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }s for this issue. You can click on the any of them to check all active issues for that ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }`,
            style: tourStyle
          }
        ]
      : []),

    ...((issue?.resources || []).length > 0
      ? [
          {
            selector: '[data-tour="resource-table"]',
            content: () => (
              <>
                <Text mb={2}>
                  Find the list of affected resources, you can select resources
                  to perform various operations
                </Text>
              </>
            ),
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="activity"]',
      content: 'Here is the audit trail of the issue',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="comment-box"]',
      content: 'You can collaborate with the team from here',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="actions"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Actions
          </Text>
          <Text mb={2}>
            You can change the{' '}
            <Box as="span" fontWeight={600}>
              severity
            </Box>{' '}
            of the issue,{' '}
            <Box as="span" fontWeight={600}>
              assign
            </Box>{' '}
            it to team members, or{' '}
            <Box as="span" fontWeight={600}>
              mute
            </Box>{' '}
            it as necessary
          </Text>
        </>
      ),
      style: tourStyle
    },
    {
      selector: '[data-tour="mute-entity"]',
      content: `You can suppress the issue for a particular ${
        moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
      } if needed`,
      style: tourStyle
    },
    {
      selector: '[data-tour="integrations"]',
      content:
        'You can create Jira ticket or PagerDuty incident for the issue from here. Optionally, manage integrations from the settings',
      style: tourStyle
    },
    // {
    //   selector: '[data-tour="pin"]',
    //   content: () => (
    //     <Text mb={2}>
    //       You can{' '}
    //       <Box as="span" fontWeight={600}>
    //         Bookmark
    //       </Box>{' '}
    //       the issue to track it closely on the Analytics page
    //     </Text>
    //   ),
    //   style: tourStyle
    // },
    {
      selector: '[data-tour="actions-two"]',
      content: () => (
        <>
          <Text mb={2}>
            <Box as="span" fontWeight={600}>
              Export
            </Box>{' '}
            the issue in PDF or CSV format.
          </Text>
          <Text mb={2}>
            PingSafe automatically marks the issue as resolved once it is fixed.
            Optionally,{' '}
            <Box as="span" fontWeight={600}>
              resolve
            </Box>{' '}
            the issue manually.
          </Text>
          {issue?.plugin.module === 'CLOUD_MONITORING' && (
            <Text mb={2}>
              PingSafe continuously monitors the cloud for any changes.
              Alternatively, run a{' '}
              <Box as="span" fontWeight={600}>
                rescan
              </Box>{' '}
              manually.
            </Text>
          )}
        </>
      ),
      style: tourStyle
    }
  ];

  return !issue ? (
    <IssuePageSkeleton breadcrumbs={breadcrumbs} />
  ) : (
    <Flex width="100%">
      {shouldBegintour && (
        <Tour
          onRequestClose={() => {
            localStorage.setItem('issue-page-tour', 'done');
            setIsTourOpen(false);
          }}
          onAfterOpen={() => {
            disableBodyScroll(document.body);
            disableBodyScroll(scrollDiv.current || document.body);
          }}
          onBeforeClose={() => {
            enableBodyScroll(document.body);
            enableBodyScroll(scrollDiv.current || document.body);
          }}
          disableInteraction={false}
          disableFocusLock={false}
          steps={tourSteps}
          isOpen={isTourOpen}
          rounded={5}
          showNavigationNumber={false}
          closeWithMask={false}
        />
      )}
      <Box
        width={['100%', '100%', isCollapsed ? '100%' : 'calc(100% - 400px)']}
        overflow="hidden"
        height="100vh"
        position="relative"
      >
        <Flex
          px={4}
          py={2}
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
            <Breadcrumb>
              {breadcrumbs.map(({ name, link }) => {
                return (
                  <BreadcrumbItem key={name} isCurrentPage={!link}>
                    {link ? (
                      // @ts-ignore
                      <BreadcrumbLink as={Link} to={link}>
                        {name}
                      </BreadcrumbLink>
                    ) : (
                      <Text
                        maxW="500px"
                        overflow="hidden"
                        style={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {name}
                      </Text>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </Breadcrumb>
          </Flex>
          <Flex alignItems="center">
            {/* <PinIssue
              issue={issue}
              colorMode={colorMode}
              isIssueLoading={isIssueLoading}
            /> */}
            <Box display={['block', 'block', 'none']}>
              <BgHoverStyle
                onClick={() => setShowDetails(!showDetails)}
                colorMode={colorMode}
                variant="bg"
                active={showDetails}
              >
                <Box as={CgDetailsMore} fontSize="18px" />
              </BgHoverStyle>
            </Box>
            <Tooltip
              label={isCollapsed ? 'Expand' : 'Collapse'}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Box display={['none', 'none', 'block']}>
                <BgHoverStyle
                  onClick={() => setCollapsed(!isCollapsed)}
                  colorMode={colorMode}
                  variant="bg"
                  active={showDetails}
                >
                  <Box
                    as={isCollapsed ? BsArrowsExpand : BsArrowsCollapse}
                    transform="rotate(90deg)"
                    fontSize="18px"
                  />
                </BgHoverStyle>
              </Box>
            </Tooltip>
          </Flex>
        </Flex>

        <Box
          position="absolute"
          width="400px"
          height="calc(100vh - 56px)"
          bottom={0}
          right={0}
          bg={`bg.secondary.${colorMode}`}
          p={5}
          display={['block', 'block', 'none']}
          transform={
            showDetails
              ? 'translate3d(0px,0px,0px)'
              : 'translate3d(400px,0,0px)'
          }
          transition="0.1s transform ease-out"
          boxShadow={`box.${colorMode}`}
          zIndex={9999}
        >
          {showDetails && (
            <IssueDetails
              issue={issue}
              issueId={issueId}
              colorMode={colorMode}
              sessionData={sessionData}
            />
          )}
        </Box>
        <Box
          width="100%"
          height="calc(100vh - 56px)"
          overflowY="scroll"
          ref={scrollDiv}
        >
          <Box py={5}>
            <Box pl="52px" pr={8}>
              <Box data-tour="information">
                <Text fontSize={20} fontWeight="500">
                  <span dangerouslySetInnerHTML={{ __html: issue.message }} />
                </Text>
                {issue.plugin.version === 'v2' && (
                  <Flex alignItems="center" fontSize="12px" color="blue.400">
                    <Box as={CgInfo} mr={1} />
                    <Text>
                      This issue was detected by a recently added plugin
                    </Text>
                  </Flex>
                )}
                <Text fontSize={16} fontWeight="500" mt={4}>
                  Description
                </Text>
                {issue?.plugin.description && (
                  <Text fontSize={14} mb={4}>
                    {issue?.plugin.description}
                  </Text>
                )}

                {issue?.plugin.impact && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Impact
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.impact}
                    </Text>
                  </Box>
                )}

                {/* {issue?.meta &&
                  Object.keys(issue.meta).map(key => {
                    if (issue.meta && typeof issue.meta[key] === 'string') {
                      return (
                        <>
                          <Text fontSize={16} fontWeight="500" mt={2}>
                            {key.toUpperCase()}
                          </Text>
                          <Text fontSize={14} mb={2}>
                            <span />
                            {issue.meta[key]}
                          </Text>
                        </>
                      );
                    }
                    return undefined;
                  })} */}
                {issue?.plugin.recommendedAction && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Recommended Action
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.recommendedAction}
                    </Text>
                  </Box>
                )}

                {issue?.plugin.infoLink && (
                  <Box mb={4}>
                    <StyledExternalLink
                      href={issue?.plugin.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Flex alignItems="center">
                        Read more about the issue{' '}
                        <Box
                          as={AiOutlineArrowRight}
                          ml={1}
                          fontSize={12}
                          mt="2px"
                        />
                      </Flex>
                    </StyledExternalLink>
                  </Box>
                )}
              </Box>
            </Box>
            {issue?.plugin.service === 'PATCHING_CADENCE' &&
              issue?.meta &&
              Array.isArray(issue.meta.vulnerabilities) && (
                <>
                  <div data-tour="cve-table">
                    <Text fontWeight={500} mb={3} marginLeft="52px">
                      Relevant CVEs
                    </Text>
                    <CveTable data={issue.meta.vulnerabilities} />
                  </div>
                </>
              )}
            <Box pl="52px" pr={8}>
              <Box data-tour="plugin-config">
                <Card colorMode={colorMode}>
                  <Flex alignItems="center" mb={4}>
                    <Text fontWeight="500" fontSize="18px" mb={1}>
                      Plugin Configuration
                    </Text>
                    {issue.plugin.version === 'v2' && (
                      <Badge variantColor="green" ml={2} mb={1}>
                        New
                      </Badge>
                    )}
                  </Flex>
                  {Object.keys(
                    issue.plugin.config || issue.plugin.configuration
                  ).length > 0 ? (
                    <>
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      )
                        .slice(0, MIN_SHOWN_PLUGINS)
                        .map(key => {
                          return (
                            <ConfigItem
                              configKey={key}
                              pluginId={issue.plugin.pluginId}
                              muted={false}
                              issueId={issueId}
                              urlPrefix={
                                issue.plugin.config ? 'config' : 'configuration'
                              }
                              {...(issue.plugin.config ||
                                issue.plugin.configuration)[key]}
                            />
                          );
                        })}
                      {showMoreConfig &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        ).length > MIN_SHOWN_PLUGINS &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        )
                          .slice(MIN_SHOWN_PLUGINS)
                          .map(key => {
                            return (
                              <ConfigItem
                                configKey={key}
                                pluginId={issue.plugin.pluginId}
                                muted={false}
                                issueId={issueId}
                                urlPrefix={
                                  issue.plugin.config
                                    ? 'config'
                                    : 'configuration'
                                }
                                {...(issue.plugin.config ||
                                  issue.plugin.configuration)[key]}
                              />
                            );
                          })}
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      ).length > MIN_SHOWN_PLUGINS && (
                        <Flex
                          w="100%"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <StyledButton
                            colorMode={colorMode}
                            onClick={() => setShowMoreConfig(!showMoreConfig)}
                          >
                            {showMoreConfig
                              ? 'Show less'
                              : `Show ${
                                  Object.keys(
                                    issue.plugin.config ||
                                      issue.plugin.configuration
                                  ).slice(MIN_SHOWN_PLUGINS).length
                                } more`}
                          </StyledButton>
                        </Flex>
                      )}
                    </>
                  ) : (
                    <Text
                      width="100%"
                      fontSize="13px"
                      color={`subtle.${colorMode}`}
                      textAlign="center"
                      my={8}
                    >
                      No configurable parameters for this plugin
                    </Text>
                  )}
                </Card>
              </Box>
              {isAllIssues && (
                <Box data-tour="entities" mb={8}>
                  <Text fontSize={16} fontWeight="500">
                    Affected{' '}
                    {capitalize(moduleEntityMapping[issue.plugin.module])}s
                  </Text>
                  <Flex alignContent="space-between" flexWrap="wrap" mt={1}>
                    {getEntityList().map(({ name, url, provider }) => (
                      <Link to={url} key={name}>
                        <Tag size="sm" my={1} mr={2} fontSize="13px">
                          <Flex alignItems="center" pb="2px">
                            {provider === 'AWS' && (
                              <Box mr={2} mt="4px">
                                <AWSIcon colorMode={colorMode} size={18} />
                              </Box>
                            )}
                            {provider === 'AZURE' && (
                              <Box mr={2} mt="2px">
                                <AzureIcon size={14} />
                              </Box>
                            )}
                            {provider === 'GOOGLE' && (
                              <Box mr={2} mt="2px">
                                <GoogleIcon size={14} />
                              </Box>
                            )}
                            <Text>{name}</Text>
                          </Flex>
                        </Tag>
                      </Link>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
            <Text fontWeight={500} mt={4} marginLeft="52px">
              Affected Resources
            </Text>
            <Box py={issue.resources.length === 0 ? 8 : 0}>{children}</Box>
          </Box>
          <Box
            // width="calc(100%-64px)"
            width="100%"
            borderWidth="1px"
            borderColor={`border.${colorMode}`}
            // mx="32px"
          />
          <Box mx="52px" py={5} data-tour="activity">
            <ActionTrail
              issueId={issue.id}
              accountId={accountId}
              domainId={domainId}
              mobileAppId={mobileAppId}
              leakMonitoringId={leakMonitoringId}
            />
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        display={['none', 'none', isCollapsed ? 'none' : 'block']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      >
        <IssueDetails
          issue={issue}
          issueId={issueId}
          colorMode={colorMode}
          sessionData={sessionData}
        />
      </Box>
    </Flex>
  );
};

export type IssueDetailsProps = {
  issueId: string;
  issue: Issue;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};

const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  issueId,
  colorMode,
  sessionData
}) => {
  return (
    <>
      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        pb={3}
      >
        <Stack
          isInline
          justifyContent={
            issue.plugin.module === 'CLOUD_MONITORING'
              ? 'space-around'
              : 'space-between'
          }
          spacing={10}
          width="100%"
          data-tour="actions-two"
        >
          <ExportIssue colorMode={colorMode} issueId={issueId} />

          <ResolveIssue
            colorMode={colorMode}
            issueId={issueId}
            status={issue.status}
          />
          {issue.plugin.module === 'CLOUD_MONITORING' ? (
            <RescanIssue colorMode={colorMode} issue={issue} />
          ) : (
            <Box width="72px" />
          )}
        </Stack>
      </Box>

      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        py={4}
        ml={2}
      >
        <ActionBarItem label="Status" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={issue.status === 'OPEN' ? GoIssueOpened : GoIssueClosed}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {issue.status}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Discovered" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue?.creationTime).getDate()}{' '}
              {monthNames[new Date(issue?.creationTime || 0).getMonth()]}{' '}
              {new Date(issue?.creationTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Updated" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue.refreshTime).getDate()}{' '}
              {monthNames[new Date(issue.refreshTime || 0).getMonth()]}{' '}
              {new Date(issue.refreshTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>
        <div data-tour="actions">
          <ActionBarItem label="Severity" colorMode={colorMode} small>
            <SeverityPicker
              variant="page"
              severity={issue.severity}
              issueId={issueId}
            />
          </ActionBarItem>

          <ActionBarItem
            label="Assignees"
            colorMode={colorMode}
            small
            dataTour="assignees"
          >
            <TeamPicker
              variant="page"
              assigneeIds={issue?.assignees || []}
              issueId={issueId}
            />
          </ActionBarItem>
          <Flex width="100%">
            <Text
              width="120px"
              color={`label.${colorMode}`}
              fontSize="13px"
              mt="10px"
            >
              Add Label
            </Text>
            <Flex alignItems="center" ml="20px">
              <LabelPicker
                issueId={issueId}
                labelIds={issue.labels.map(label => label.labelId)}
              />
            </Flex>
          </Flex>
          <ActionBarItem
            label="Mute Issue"
            colorMode={colorMode}
            dataTour="mute-issue"
          >
            <Flex alignItems="center" ml="23px">
              <IssueMute issue={issue} />
            </Flex>
          </ActionBarItem>
        </div>

        <div data-tour="mute-entity">
          {issue.accounts && issue.accounts.length !== 0 && (
            <ActionBarItem label="Muted Accounts" colorMode={colorMode} small>
              <MutePicker
                accounts={issue.accounts}
                mutedIds={issue.accounts
                  .filter(({ muted }) => muted)
                  .map(({ accountId }) => accountId)}
                issueId={issueId}
                disabled={issue.muted}
              />
            </ActionBarItem>
          )}
          {issue.domains && issue.domains.length !== 0 && (
            <ActionBarItem label="Muted Domains" colorMode={colorMode} small>
              <MutePicker
                domains={issue.domains}
                mutedIds={issue.domains
                  .filter(({ muted }) => muted)
                  .map(({ domainId }) => domainId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
          {issue.mobileApps && issue.mobileApps.length !== 0 && (
            <ActionBarItem label="Muted Apps" colorMode={colorMode} small>
              <MutePicker
                mobileApps={issue.mobileApps}
                mutedIds={issue.mobileApps
                  .filter(({ muted }) => muted)
                  .map(({ mobileAppId }) => mobileAppId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
        </div>
      </Box>
      <TicketManager
        sessionData={sessionData}
        issueId={issueId}
        colorMode={colorMode}
      />
    </>
  );
};

export type ActionBarItemProps = {
  label: string;
  colorMode: 'light' | 'dark';
  small?: boolean;
  dataTour?: string;
};
export const ActionBarItem: React.FC<ActionBarItemProps> = ({
  label,
  children,
  colorMode,
  small,
  dataTour
}) => {
  return (
    <Flex
      width="100%"
      py={small ? 1 : 3}
      alignItems="center"
      data-tour={dataTour}
    >
      <Text width="120px" color={`label.${colorMode}`} fontSize="13px">
        {label}
      </Text>

      {children}
    </Flex>
  );
};

export type TicketManagerProps = {
  issueId: string;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};
export const TicketManager: React.FC<TicketManagerProps> = ({
  colorMode,
  issueId,
  sessionData
}) => {
  const { data: ticketData, isLoading: isTicketLoading } = useTicket(issueId);
  const [ticketMutate] = useTicketMutation();
  const [loading, setLoading] = useState({
    JIRA: false,
    PAGER_DUTY: false,
    WEBHOOK: false
  });
  const queryCache = useQueryCache();
  const { addToast } = useToasts();

  const hasJiraIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'JIRA'
  );
  const hasPagerDutyIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'PAGER_DUTY'
  );
  const hasWebhookIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'WEBHOOK'
  );
  const handleClick = async (channel: 'JIRA' | 'PAGER_DUTY' | 'WEBHOOK') => {
    try {
      setLoading({ ...loading, [channel]: true });
      await ticketMutate({ channel, issues: [issueId] });
      await queryCache.invalidateQueries(['ticket', issueId]);
      setLoading({ ...loading, [channel]: false });
      if (channel === 'WEBHOOK') {
        addToast('Issue event successfully sent to webhook.', {
          appearance: 'success'
        });
      }
    } catch (e) {
      setLoading({ ...loading, [channel]: false });
    }
  };

  return sessionData ? (
    <Box
      data-tour="integrations"
      width="100%"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor={`border.${colorMode}`}
      py={4}
      ml={2}
    >
      <ActionBarItem label="Jira" colorMode={colorMode}>
        {isTicketLoading || loading.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.JIRA.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.JIRA.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasJiraIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('JIRA')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create ticket
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/jira"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      <ActionBarItem label="PagerDuty" colorMode={colorMode}>
        {isTicketLoading || loading.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.PAGER_DUTY.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.PAGER_DUTY.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasPagerDutyIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('PAGER_DUTY')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create Incident
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/pagerduty"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      {hasWebhookIntegration && (
        <ActionBarItem label="Webhook" colorMode={colorMode}>
          {isTicketLoading || loading.WEBHOOK ? (
            <Flex alignItems="center" ml="12px">
              <Spinner size="xs" my={3} ml={2} />
            </Flex>
          ) : (
            <StyledButton
              onClick={() => handleClick('WEBHOOK')}
              colorMode={colorMode}
              ml="16px"
            >
              Trigger Event
            </StyledButton>
          )}
        </ActionBarItem>
      )}
    </Box>
  ) : (
    <Flex my={10} ml={32}>
      <Spinner size="md" />
    </Flex>
  );
};

const IssueMute: React.FC<{ issue: Issue }> = ({ issue }) => {
  const [muteMutate] = useMuteIssueMutation(issue.id);
  const [unmuteMutate] = useUnmuteIssueMutation(issue.id);

  const handleIssueMute = () => {
    if (issue.muted) {
      unmuteMutate({ issues: [issue.id] });
    } else {
      muteMutate({ issues: [issue.id] });
    }
  };
  return (
    <>
      <Switch size="sm" isChecked={issue.muted} onChange={handleIssueMute} />
      <Text fontSize="13px" ml={3}>
        {issue.muted ? 'Issue muted' : 'Issue not muted'}
      </Text>
    </>
  );
};

type FormData = {
  format: string;
};

const ExportIssue: React.FC<{
  issueId: string;
  colorMode: string;
}> = ({ issueId, colorMode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleSubmit, register, formState } = useForm<FormData>();
  const { addToast } = useToasts();

  const onExport = async ({ format }: FormData) => {
    try {
      await API.post(
        `/issues/export`,
        {
          issues: [issueId],
          format
        },
        { ...(format === 'pdf' && { responseType: 'blob' }) }
      );
      onClose();
      addToast('The report will be emailed to you in 10-15 mins.', {
        appearance: 'success'
      });
    } catch (e) {
      console.log(e);
    }
    onClose();
  };
  return (
    <>
      <Button
        data-tour="export"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        onClick={onOpen}
      >
        <IconContext.Provider
          value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
        >
          <Box as={AiOutlineExport} mr={2} fontSize="14px" />
        </IconContext.Provider>
        Export
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          key="modal"
          initial={{
            opacity: 0.9,
            scale: 0.98,
            perspective: '0px',
            perspectiveOrigin: '50% 249.32px'
          }}
          animate={{ scale: 1.05, opacity: 1, perspective: '110px' }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          <ModalHeader
            mb={2}
            borderBottomWidth="1px"
            borderBottomColor={`border.${colorMode}`}
          >
            Export Issue
          </ModalHeader>
          <form onSubmit={handleSubmit(onExport)}>
            <ModalBody>
              <Box minH="70px" width="100%">
                <Flex
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={4}
                >
                  <Text color={`label.${colorMode}`} fontWeight={500}>
                    Format
                  </Text>
                  <Select
                    size="sm"
                    name="format"
                    defaultValue="csv"
                    width="150px"
                    ref={register}
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </Select>
                </Flex>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                variantColor="primary"
                mr={3}
                size="sm"
                type="submit"
                isLoading={formState.isSubmitting}
              >
                Export
              </Button>
              <Button size="sm" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

const ResolveIssue: React.FC<{
  issueId: string;
  colorMode: string;
  status: string;
}> = ({ issueId, colorMode, status }) => {
  const queryCache = useQueryCache();
  const [isOpen, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);

  const resolveIssue = async () => {
    await API.put(`/issues/resolve`, {
      issues: [issueId]
    });
  };
  const [mutate, { isLoading }] = useMutation(resolveIssue, {
    onSuccess: async () => {
      // queryCache.invalidateQueries(['issues']);
      queryCache.invalidateQueries(['issue', issueId]);
      queryCache.invalidateQueries(['actionTrail', issueId]);
    }
  });
  return (
    <>
      <Button
        data-tour="resolve"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        isDisabled={status !== 'OPEN'}
        onClick={() => setOpen(true)}
      >
        {isLoading ? (
          <>
            <Spinner size="xs" mr={2} /> Resolving...
          </>
        ) : (
          <>
            <IconContext.Provider
              value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
            >
              <Box as={AiOutlineCheck} mr={2} fontSize="16px" />
            </IconContext.Provider>
            {status === 'OPEN' ? 'Resolve' : 'Resolved'}
          </>
        )}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        headerText="Resolve Issues"
        bodyText="Are you sure you want to mark this issue as resolved?"
        actionButtonColor="green"
        actionButtonText="Resolve"
        onConfirm={() => {
          mutate();
          setOpen(false);
        }}
      />
    </>
  );
};

const PinIssue: React.FC<{
  issue: Issue;
  colorMode: string;
  isIssueLoading: boolean;
}> = ({ issue, colorMode, isIssueLoading }) => {
  const queryCache = useQueryCache();
  const pinIssue = async () => {
    await API.put(`/issues/pin`, {
      issues: [issue.id]
    });
  };
  const unpinIssue = async () => {
    await API.put(`/issues/unpin`, {
      issues: [issue.id]
    });
  };
  const [pinMutate, { isLoading: isPinLoading }] = useMutation(pinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  const [unpinMutate, { isLoading: isUnpinLoading }] = useMutation(unpinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  return (
    <Tooltip label="Pin Issue" aria-label="Pin Issue">
      <Box width="40px" mr={1} data-tour="pin">
        {(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <BgHoverStyle colorMode={colorMode} variant="bg">
            <Spinner size="sm" my="1px" />
          </BgHoverStyle>
        )}
        {!(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <Box onClick={() => (issue.pinned ? unpinMutate() : pinMutate())}>
            <BgHoverStyle colorMode={colorMode} variant="bg">
              {issue.pinned ? (
                <Box as={AiFillPushpin} fontSize="18px" />
              ) : (
                <Box as={AiOutlinePushpin} fontSize="18px" />
              )}
            </BgHoverStyle>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

const IssuePageSkeleton: React.FC<{
  breadcrumbs: { name?: string; link: string | null }[];
}> = ({ breadcrumbs }) => {
  const { colorMode } = useColorMode();
  const backLink = breadcrumbs[0].link;

  return (
    <Flex width="100%">
      <Box
        width={['100%', '100%', 'calc(100% - 400px)']}
        height="100vh"
        overflowY="scroll"
      >
        <Flex
          p={4}
          alignItems="center"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
          </Flex>
          <Breadcrumb>
            {breadcrumbs.map(({ name, link }, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <BreadcrumbItem key={index} isCurrentPage={!link}>
                  {link ? (
                    // @ts-ignore
                    <BreadcrumbLink as={Link} to={link}>
                      {name}
                    </BreadcrumbLink>
                  ) : (
                    <Text
                      maxW="500px"
                      overflow="hidden"
                      style={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {name}
                    </Text>
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </Flex>

        <Box pl="52px" mb={4}>
          <Box maxW="600px">
            <Skeleton>
              <Text fontSize={20} fontWeight="500" my={10}>
                Test
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>

            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      />
    </Flex>
  );
};

export default IssuePageLayout;


/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-shadow */
/* eslint-disable no-nested-ternary */
import React, { useState, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import Tour from 'reactour';
import { useToasts } from 'react-toast-notifications';

import { useQueryCache, useMutation } from 'react-query';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

import {
  Flex,
  Box,
  PseudoBox,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorMode,
  Text,
  Spinner,
  Skeleton,
  Switch,
  Select,
  Modal,
  ModalOverlay,
  ModalContent as MC,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tag,
  Stack,
  Badge
} from '@chakra-ui/core';
import { IconContext } from 'react-icons';
import { FaAngleLeft } from 'react-icons/fa';
import { CgDetailsMore, CgInfo } from 'react-icons/cg';
import { BsArrowsCollapse, BsArrowsExpand } from 'react-icons/bs';

import {
  AiOutlineClockCircle,
  AiOutlineExport,
  AiOutlineCheck,
  AiOutlineArrowRight,
  AiOutlinePushpin,
  AiFillPushpin
} from 'react-icons/ai';
import { IoMdAddCircleOutline } from 'react-icons/io';
import { RiExternalLinkLine } from 'react-icons/ri';
import { GoIssueOpened, GoIssueClosed } from 'react-icons/go';
import { VscDebugDisconnect } from 'react-icons/vsc';

import { AWSIcon, AzureIcon, GoogleIcon } from 'components/icons';

import {
  TeamPicker,
  MutePicker,
  SeverityPicker,
  HoverStyle,
  LabelPicker
} from 'components/pickers';

import RescanIssue from 'components/rescanIssue';
import ActionTrail from 'components/actionTrail';
import CveTable from 'components/cveTable';
import { HoverStyle as BgHoverStyle, SidebarToggle } from 'components/sidebar';

import ConfigItem from 'pages/Settings/components/configItem';

import {
  StyledExternalLink,
  Button as StyledButton,
  Tooltip,
  AlertDialog
} from 'components/primitives';
import Card from 'components/card';

import { useTicket, useTicketMutation } from 'hooks/useTicket';
import useSession from 'hooks/useSession';
import {
  useMuteIssueMutation,
  useUnmuteIssueMutation
} from 'hooks/useMuteMutation';

import { Issue, Session } from 'common/types';
import { moduleEntityMapping, monthNames } from 'common/values';

import API from 'helpers/api';
import { capitalize } from 'common/functions';

const ModalContent = motion.custom(MC);

type Entity = {
  name: string;
  new: boolean;
  url: string;
  provider?: string;
};

export type IssuePageProps = {
  breadcrumbs: { name?: string; link: string | null }[];
  isIssueLoading: boolean;
  issue?: Issue;
};

const tourStyle = {
  color: '#fff',
  backgroundColor: '#1f2023',
  border: '1px solid #303236',
  padding: '40px 40px 20px 40px',
  minWidth: '360px'
};

const MIN_SHOWN_PLUGINS = 3;

const IssuePageLayout: React.FC<IssuePageProps> = ({
  breadcrumbs,
  children,
  issue,
  isIssueLoading
}) => {
  const { colorMode } = useColorMode();
  const {
    issueId,
    accountId,
    domainId,
    mobileAppId,
    leakMonitoringId
  } = useParams<{
    issueId: string;
    accountId?: string;
    domainId?: string;
    mobileAppId?: string;
    leakMonitoringId?: string;
  }>();
  const location = useLocation();
  const { data: sessionData } = useSession();
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [showMoreConfig, setShowMoreConfig] = useState(false);

  const scrollDiv = useRef<HTMLElement>(null);

  const backLink = breadcrumbs[0].link;
  const urlHasTour = Boolean(new URLSearchParams(location.search).get('tour'));
  const shouldBegintour =
    !localStorage.getItem('issue-page-tour') || urlHasTour;

  const isAllIssues =
    !accountId && !domainId && !mobileAppId && !leakMonitoringId;

  const pluginConfigUrl = `/settings/config/${
    issue?.plugin.module === 'CLOUD_MONITORING'
      ? issue.plugin.provider
      : issue?.plugin.module === 'DOMAIN_MONITORING'
      ? issue.plugin.service
      : issue?.plugin.module === 'MOBILE_SECURITY'
      ? 'MOBILE_SECURITY'
      : 'DATA_LEAK_MONITORING'
  }?pluginId=${issue?.plugin.pluginId}`;

  const getEntityList = (): Entity[] => {
    if (issue && sessionData) {
      if (issue?.plugin.module === 'CLOUD_MONITORING') {
        return sessionData.accounts
          .filter(({ accountId }) =>
            issue.accounts
              ?.map(({ accountId }) => accountId)
              .includes(accountId)
          )
          .map(({ title, accountId, provider }) => ({
            provider,
            name: title,
            new: false,
            url: `/cloud/${accountId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DOMAIN_MONITORING') {
        return sessionData.domains
          .filter(({ domainId }) =>
            issue.domains?.map(({ domainId }) => domainId).includes(domainId)
          )
          .map(({ domain, domainId }) => ({
            name: domain,
            new: false,
            url: `/asset/${domainId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'MOBILE_SECURITY') {
        return sessionData.mobileApps
          .filter(({ mobileAppId }) =>
            issue.mobileApps
              ?.map(({ mobileAppId }) => mobileAppId)
              .includes(mobileAppId)
          )
          .map(({ title, mobileAppId }) => ({
            name: title,
            new: false,
            url: `/mobile/${mobileAppId}/issues/${issueId}`
          }));
      }
      if (issue?.plugin.module === 'DATA_LEAK_MONITORING') {
        return sessionData.leakMonitorings
          .filter(({ leakMonitoringId }) =>
            issue.leakMonitorings
              ?.map(({ leakMonitoringId }) => leakMonitoringId)
              .includes(leakMonitoringId)
          )
          .map(({ title, leakMonitoringId }) => ({
            name: title,
            new: false,
            url: `/dataleak/${leakMonitoringId}/issues/${issueId}`
          }));
      }
    }
    return [];
  };

  const tourSteps = [
    {
      selector: '[data-tour="information"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Quick Page Tour
          </Text>
          <Text mb={2}>
            Find all the relevant information about the issue and the steps to
            fix it here
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(issue?.plugin.service === 'PATCHING_CADENCE'
      ? [
          {
            selector: '[data-tour="cve-table"]',
            content:
              'Here is the list of affected CVEs along with the description and severity',
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="plugin-config"]',
      content: () => (
        <>
          <Text mb={2}>
            For issues related to cloud governance you can manage the issue
            configuration as per your needs. You can also access{' '}
            <StyledExternalLink href={pluginConfigUrl} target="_blank">
              PingSafe Security Hub
            </StyledExternalLink>{' '}
            from Settings to manage this at any point
          </Text>
        </>
      ),
      style: tourStyle
    },
    ...(isAllIssues
      ? [
          {
            selector: '[data-tour="entities"]',
            content: `Here is a list of the affected ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }s for this issue. You can click on the any of them to check all active issues for that ${
              moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
            }`,
            style: tourStyle
          }
        ]
      : []),

    ...((issue?.resources || []).length > 0
      ? [
          {
            selector: '[data-tour="resource-table"]',
            content: () => (
              <>
                <Text mb={2}>
                  Find the list of affected resources, you can select resources
                  to perform various operations
                </Text>
              </>
            ),
            style: tourStyle
          }
        ]
      : []),
    {
      selector: '[data-tour="activity"]',
      content: 'Here is the audit trail of the issue',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="comment-box"]',
      content: 'You can collaborate with the team from here',
      position: 'bottom' as const,
      style: tourStyle
    },
    {
      selector: '[data-tour="actions"]',
      content: () => (
        <>
          <Text mb={2} fontSize="17px" fontWeight={600}>
            Actions
          </Text>
          <Text mb={2}>
            You can change the{' '}
            <Box as="span" fontWeight={600}>
              severity
            </Box>{' '}
            of the issue,{' '}
            <Box as="span" fontWeight={600}>
              assign
            </Box>{' '}
            it to team members, or{' '}
            <Box as="span" fontWeight={600}>
              mute
            </Box>{' '}
            it as necessary
          </Text>
        </>
      ),
      style: tourStyle
    },
    {
      selector: '[data-tour="mute-entity"]',
      content: `You can suppress the issue for a particular ${
        moduleEntityMapping[issue?.plugin?.module || 'DEFAULT']
      } if needed`,
      style: tourStyle
    },
    {
      selector: '[data-tour="integrations"]',
      content:
        'You can create Jira ticket or PagerDuty incident for the issue from here. Optionally, manage integrations from the settings',
      style: tourStyle
    },
    // {
    //   selector: '[data-tour="pin"]',
    //   content: () => (
    //     <Text mb={2}>
    //       You can{' '}
    //       <Box as="span" fontWeight={600}>
    //         Bookmark
    //       </Box>{' '}
    //       the issue to track it closely on the Analytics page
    //     </Text>
    //   ),
    //   style: tourStyle
    // },
    {
      selector: '[data-tour="actions-two"]',
      content: () => (
        <>
          <Text mb={2}>
            <Box as="span" fontWeight={600}>
              Export
            </Box>{' '}
            the issue in PDF or CSV format.
          </Text>
          <Text mb={2}>
            PingSafe automatically marks the issue as resolved once it is fixed.
            Optionally,{' '}
            <Box as="span" fontWeight={600}>
              resolve
            </Box>{' '}
            the issue manually.
          </Text>
          {issue?.plugin.module === 'CLOUD_MONITORING' && (
            <Text mb={2}>
              PingSafe continuously monitors the cloud for any changes.
              Alternatively, run a{' '}
              <Box as="span" fontWeight={600}>
                rescan
              </Box>{' '}
              manually.
            </Text>
          )}
        </>
      ),
      style: tourStyle
    }
  ];

  return !issue ? (
    <IssuePageSkeleton breadcrumbs={breadcrumbs} />
  ) : (
    <Flex width="100%">
      {shouldBegintour && (
        <Tour
          onRequestClose={() => {
            localStorage.setItem('issue-page-tour', 'done');
            setIsTourOpen(false);
          }}
          onAfterOpen={() => {
            disableBodyScroll(document.body);
            disableBodyScroll(scrollDiv.current || document.body);
          }}
          onBeforeClose={() => {
            enableBodyScroll(document.body);
            enableBodyScroll(scrollDiv.current || document.body);
          }}
          disableInteraction={false}
          disableFocusLock={false}
          steps={tourSteps}
          isOpen={isTourOpen}
          rounded={5}
          showNavigationNumber={false}
          closeWithMask={false}
        />
      )}
      <Box
        width={['100%', '100%', isCollapsed ? '100%' : 'calc(100% - 400px)']}
        overflow="hidden"
        height="100vh"
        position="relative"
      >
        <Flex
          px={4}
          py={2}
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
            <Breadcrumb>
              {breadcrumbs.map(({ name, link }) => {
                return (
                  <BreadcrumbItem key={name} isCurrentPage={!link}>
                    {link ? (
                      // @ts-ignore
                      <BreadcrumbLink as={Link} to={link}>
                        {name}
                      </BreadcrumbLink>
                    ) : (
                      <Text
                        maxW="500px"
                        overflow="hidden"
                        style={{
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {name}
                      </Text>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </Breadcrumb>
          </Flex>
          <Flex alignItems="center">
            {/* <PinIssue
              issue={issue}
              colorMode={colorMode}
              isIssueLoading={isIssueLoading}
            /> */}
            <Box display={['block', 'block', 'none']}>
              <BgHoverStyle
                onClick={() => setShowDetails(!showDetails)}
                colorMode={colorMode}
                variant="bg"
                active={showDetails}
              >
                <Box as={CgDetailsMore} fontSize="18px" />
              </BgHoverStyle>
            </Box>
            <Tooltip
              label={isCollapsed ? 'Expand' : 'Collapse'}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Box display={['none', 'none', 'block']}>
                <BgHoverStyle
                  onClick={() => setCollapsed(!isCollapsed)}
                  colorMode={colorMode}
                  variant="bg"
                  active={showDetails}
                >
                  <Box
                    as={isCollapsed ? BsArrowsExpand : BsArrowsCollapse}
                    transform="rotate(90deg)"
                    fontSize="18px"
                  />
                </BgHoverStyle>
              </Box>
            </Tooltip>
          </Flex>
        </Flex>

        <Box
          position="absolute"
          width="400px"
          height="calc(100vh - 56px)"
          bottom={0}
          right={0}
          bg={`bg.secondary.${colorMode}`}
          p={5}
          display={['block', 'block', 'none']}
          transform={
            showDetails
              ? 'translate3d(0px,0px,0px)'
              : 'translate3d(400px,0,0px)'
          }
          transition="0.1s transform ease-out"
          boxShadow={`box.${colorMode}`}
          zIndex={9999}
        >
          {showDetails && (
            <IssueDetails
              issue={issue}
              issueId={issueId}
              colorMode={colorMode}
              sessionData={sessionData}
            />
          )}
        </Box>
        <Box
          width="100%"
          height="calc(100vh - 56px)"
          overflowY="scroll"
          ref={scrollDiv}
        >
          <Box py={5}>
            <Box pl="52px" pr={8}>
              <Box data-tour="information">
                <Text fontSize={20} fontWeight="500">
                  <span dangerouslySetInnerHTML={{ __html: issue.message }} />
                </Text>
                {issue.plugin.version === 'v2' && (
                  <Flex alignItems="center" fontSize="12px" color="blue.400">
                    <Box as={CgInfo} mr={1} />
                    <Text>
                      This issue was detected by a recently added plugin
                    </Text>
                  </Flex>
                )}
                <Text fontSize={16} fontWeight="500" mt={4}>
                  Description
                </Text>
                {issue?.plugin.description && (
                  <Text fontSize={14} mb={4}>
                    {issue?.plugin.description}
                  </Text>
                )}

                {issue?.plugin.impact && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Impact
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.impact}
                    </Text>
                  </Box>
                )}

                {/* {issue?.meta &&
                  Object.keys(issue.meta).map(key => {
                    if (issue.meta && typeof issue.meta[key] === 'string') {
                      return (
                        <>
                          <Text fontSize={16} fontWeight="500" mt={2}>
                            {key.toUpperCase()}
                          </Text>
                          <Text fontSize={14} mb={2}>
                            <span />
                            {issue.meta[key]}
                          </Text>
                        </>
                      );
                    }
                    return undefined;
                  })} */}
                {issue?.plugin.recommendedAction && (
                  <Box w="100%">
                    <Text fontSize={16} fontWeight="500" mt={4}>
                      Recommended Action
                    </Text>
                    <Text fontSize={14} mb={4} whiteSpace="pre-wrap">
                      {issue?.plugin.recommendedAction}
                    </Text>
                  </Box>
                )}

                {issue?.plugin.infoLink && (
                  <Box mb={4}>
                    <StyledExternalLink
                      href={issue?.plugin.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Flex alignItems="center">
                        Read more about the issue{' '}
                        <Box
                          as={AiOutlineArrowRight}
                          ml={1}
                          fontSize={12}
                          mt="2px"
                        />
                      </Flex>
                    </StyledExternalLink>
                  </Box>
                )}
              </Box>
            </Box>
            {issue?.plugin.service === 'PATCHING_CADENCE' &&
              issue?.meta &&
              Array.isArray(issue.meta.vulnerabilities) && (
                <>
                  <div data-tour="cve-table">
                    <Text fontWeight={500} mb={3} marginLeft="52px">
                      Relevant CVEs
                    </Text>
                    <CveTable data={issue.meta.vulnerabilities} />
                  </div>
                </>
              )}
            <Box pl="52px" pr={8}>
              <Box data-tour="plugin-config">
                <Card colorMode={colorMode}>
                  <Flex alignItems="center" mb={4}>
                    <Text fontWeight="500" fontSize="18px" mb={1}>
                      Plugin Configuration
                    </Text>
                    {issue.plugin.version === 'v2' && (
                      <Badge variantColor="green" ml={2} mb={1}>
                        New
                      </Badge>
                    )}
                  </Flex>
                  {Object.keys(
                    issue.plugin.config || issue.plugin.configuration
                  ).length > 0 ? (
                    <>
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      )
                        .slice(0, MIN_SHOWN_PLUGINS)
                        .map(key => {
                          return (
                            <ConfigItem
                              configKey={key}
                              pluginId={issue.plugin.pluginId}
                              muted={false}
                              issueId={issueId}
                              urlPrefix={
                                issue.plugin.config ? 'config' : 'configuration'
                              }
                              {...(issue.plugin.config ||
                                issue.plugin.configuration)[key]}
                            />
                          );
                        })}
                      {showMoreConfig &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        ).length > MIN_SHOWN_PLUGINS &&
                        Object.keys(
                          issue.plugin.config || issue.plugin.configuration
                        )
                          .slice(MIN_SHOWN_PLUGINS)
                          .map(key => {
                            return (
                              <ConfigItem
                                configKey={key}
                                pluginId={issue.plugin.pluginId}
                                muted={false}
                                issueId={issueId}
                                urlPrefix={
                                  issue.plugin.config
                                    ? 'config'
                                    : 'configuration'
                                }
                                {...(issue.plugin.config ||
                                  issue.plugin.configuration)[key]}
                              />
                            );
                          })}
                      {Object.keys(
                        issue.plugin.config || issue.plugin.configuration
                      ).length > MIN_SHOWN_PLUGINS && (
                        <Flex
                          w="100%"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <StyledButton
                            colorMode={colorMode}
                            onClick={() => setShowMoreConfig(!showMoreConfig)}
                          >
                            {showMoreConfig
                              ? 'Show less'
                              : `Show ${
                                  Object.keys(
                                    issue.plugin.config ||
                                      issue.plugin.configuration
                                  ).slice(MIN_SHOWN_PLUGINS).length
                                } more`}
                          </StyledButton>
                        </Flex>
                      )}
                    </>
                  ) : (
                    <Text
                      width="100%"
                      fontSize="13px"
                      color={`subtle.${colorMode}`}
                      textAlign="center"
                      my={8}
                    >
                      No configurable parameters for this plugin
                    </Text>
                  )}
                </Card>
              </Box>
              {isAllIssues && (
                <Box data-tour="entities" mb={8}>
                  <Text fontSize={16} fontWeight="500">
                    Affected{' '}
                    {capitalize(moduleEntityMapping[issue.plugin.module])}s
                  </Text>
                  <Flex alignContent="space-between" flexWrap="wrap" mt={1}>
                    {getEntityList().map(({ name, url, provider }) => (
                      <Link to={url} key={name}>
                        <Tag size="sm" my={1} mr={2} fontSize="13px">
                          <Flex alignItems="center" pb="2px">
                            {provider === 'AWS' && (
                              <Box mr={2} mt="4px">
                                <AWSIcon colorMode={colorMode} size={18} />
                              </Box>
                            )}
                            {provider === 'AZURE' && (
                              <Box mr={2} mt="2px">
                                <AzureIcon size={14} />
                              </Box>
                            )}
                            {provider === 'GOOGLE' && (
                              <Box mr={2} mt="2px">
                                <GoogleIcon size={14} />
                              </Box>
                            )}
                            <Text>{name}</Text>
                          </Flex>
                        </Tag>
                      </Link>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
            <Text fontWeight={500} mt={4} marginLeft="52px">
              Affected Resources
            </Text>
            <Box py={issue.resources.length === 0 ? 8 : 0}>{children}</Box>
          </Box>
          <Box
            // width="calc(100%-64px)"
            width="100%"
            borderWidth="1px"
            borderColor={`border.${colorMode}`}
            // mx="32px"
          />
          <Box mx="52px" py={5} data-tour="activity">
            <ActionTrail
              issueId={issue.id}
              accountId={accountId}
              domainId={domainId}
              mobileAppId={mobileAppId}
              leakMonitoringId={leakMonitoringId}
            />
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        display={['none', 'none', isCollapsed ? 'none' : 'block']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      >
        <IssueDetails
          issue={issue}
          issueId={issueId}
          colorMode={colorMode}
          sessionData={sessionData}
        />
      </Box>
    </Flex>
  );
};

export type IssueDetailsProps = {
  issueId: string;
  issue: Issue;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};

const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  issueId,
  colorMode,
  sessionData
}) => {
  return (
    <>
      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        pb={3}
      >
        <Stack
          isInline
          justifyContent={
            issue.plugin.module === 'CLOUD_MONITORING'
              ? 'space-around'
              : 'space-between'
          }
          spacing={10}
          width="100%"
          data-tour="actions-two"
        >
          <ExportIssue colorMode={colorMode} issueId={issueId} />

          <ResolveIssue
            colorMode={colorMode}
            issueId={issueId}
            status={issue.status}
          />
          {issue.plugin.module === 'CLOUD_MONITORING' ? (
            <RescanIssue colorMode={colorMode} issue={issue} />
          ) : (
            <Box width="72px" />
          )}
        </Stack>
      </Box>

      <Box
        width="100%"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor={`border.${colorMode}`}
        py={4}
        ml={2}
      >
        <ActionBarItem label="Status" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={issue.status === 'OPEN' ? GoIssueOpened : GoIssueClosed}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {issue.status}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Discovered" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue?.creationTime).getDate()}{' '}
              {monthNames[new Date(issue?.creationTime || 0).getMonth()]}{' '}
              {new Date(issue?.creationTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>

        <ActionBarItem label="Updated" colorMode={colorMode}>
          <Flex alignItems="center" ml="23px">
            <Box
              mr={3}
              as={AiOutlineClockCircle}
              opacity={0.5}
              fontSize="15px"
            />
            <Text mr={3} fontSize="13px">
              {new Date(issue.refreshTime).getDate()}{' '}
              {monthNames[new Date(issue.refreshTime || 0).getMonth()]}{' '}
              {new Date(issue.refreshTime || 0).getFullYear()}
            </Text>
          </Flex>
        </ActionBarItem>
        <div data-tour="actions">
          <ActionBarItem label="Severity" colorMode={colorMode} small>
            <SeverityPicker
              variant="page"
              severity={issue.severity}
              issueId={issueId}
            />
          </ActionBarItem>

          <ActionBarItem
            label="Assignees"
            colorMode={colorMode}
            small
            dataTour="assignees"
          >
            <TeamPicker
              variant="page"
              assigneeIds={issue?.assignees || []}
              issueId={issueId}
            />
          </ActionBarItem>
          <Flex width="100%">
            <Text
              width="120px"
              color={`label.${colorMode}`}
              fontSize="13px"
              mt="10px"
            >
              Add Label
            </Text>
            <Flex alignItems="center" ml="20px">
              <LabelPicker
                issueId={issueId}
                labelIds={issue.labels.map(label => label.labelId)}
              />
            </Flex>
          </Flex>
          <ActionBarItem
            label="Mute Issue"
            colorMode={colorMode}
            dataTour="mute-issue"
          >
            <Flex alignItems="center" ml="23px">
              <IssueMute issue={issue} />
            </Flex>
          </ActionBarItem>
        </div>

        <div data-tour="mute-entity">
          {issue.accounts && issue.accounts.length !== 0 && (
            <ActionBarItem label="Muted Accounts" colorMode={colorMode} small>
              <MutePicker
                accounts={issue.accounts}
                mutedIds={issue.accounts
                  .filter(({ muted }) => muted)
                  .map(({ accountId }) => accountId)}
                issueId={issueId}
                disabled={issue.muted}
              />
            </ActionBarItem>
          )}
          {issue.domains && issue.domains.length !== 0 && (
            <ActionBarItem label="Muted Domains" colorMode={colorMode} small>
              <MutePicker
                domains={issue.domains}
                mutedIds={issue.domains
                  .filter(({ muted }) => muted)
                  .map(({ domainId }) => domainId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
          {issue.mobileApps && issue.mobileApps.length !== 0 && (
            <ActionBarItem label="Muted Apps" colorMode={colorMode} small>
              <MutePicker
                mobileApps={issue.mobileApps}
                mutedIds={issue.mobileApps
                  .filter(({ muted }) => muted)
                  .map(({ mobileAppId }) => mobileAppId)}
                issueId={issueId}
              />
            </ActionBarItem>
          )}
        </div>
      </Box>
      <TicketManager
        sessionData={sessionData}
        issueId={issueId}
        colorMode={colorMode}
      />
    </>
  );
};

export type ActionBarItemProps = {
  label: string;
  colorMode: 'light' | 'dark';
  small?: boolean;
  dataTour?: string;
};
export const ActionBarItem: React.FC<ActionBarItemProps> = ({
  label,
  children,
  colorMode,
  small,
  dataTour
}) => {
  return (
    <Flex
      width="100%"
      py={small ? 1 : 3}
      alignItems="center"
      data-tour={dataTour}
    >
      <Text width="120px" color={`label.${colorMode}`} fontSize="13px">
        {label}
      </Text>

      {children}
    </Flex>
  );
};

export type TicketManagerProps = {
  issueId: string;
  colorMode: 'light' | 'dark';
  sessionData?: Session;
};
export const TicketManager: React.FC<TicketManagerProps> = ({
  colorMode,
  issueId,
  sessionData
}) => {
  const { data: ticketData, isLoading: isTicketLoading } = useTicket(issueId);
  const [ticketMutate] = useTicketMutation();
  const [loading, setLoading] = useState({
    JIRA: false,
    PAGER_DUTY: false,
    WEBHOOK: false
  });
  const queryCache = useQueryCache();
  const { addToast } = useToasts();

  const hasJiraIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'JIRA'
  );
  const hasPagerDutyIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'PAGER_DUTY'
  );
  const hasWebhookIntegration = !!sessionData?.integrations.find(
    ({ channel }) => channel === 'WEBHOOK'
  );
  const handleClick = async (channel: 'JIRA' | 'PAGER_DUTY' | 'WEBHOOK') => {
    try {
      setLoading({ ...loading, [channel]: true });
      await ticketMutate({ channel, issues: [issueId] });
      await queryCache.invalidateQueries(['ticket', issueId]);
      setLoading({ ...loading, [channel]: false });
      if (channel === 'WEBHOOK') {
        addToast('Issue event successfully sent to webhook.', {
          appearance: 'success'
        });
      }
    } catch (e) {
      setLoading({ ...loading, [channel]: false });
    }
  };

  return sessionData ? (
    <Box
      data-tour="integrations"
      width="100%"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor={`border.${colorMode}`}
      py={4}
      ml={2}
    >
      <ActionBarItem label="Jira" colorMode={colorMode}>
        {isTicketLoading || loading.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.JIRA ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.JIRA.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.JIRA.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasJiraIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('JIRA')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create ticket
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/jira"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      <ActionBarItem label="PagerDuty" colorMode={colorMode}>
        {isTicketLoading || loading.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <Spinner size="xs" my={3} ml={2} />
          </Flex>
        ) : ticketData?.PAGER_DUTY ? (
          <Flex alignItems="center" ml="12px">
            <a
              href={ticketData.PAGER_DUTY.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={RiExternalLinkLine} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  {ticketData.PAGER_DUTY.id}
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        ) : hasPagerDutyIntegration ? (
          <Flex
            alignItems="center"
            ml="12px"
            onClick={() => handleClick('PAGER_DUTY')}
          >
            <HoverStyle>
              <Box as={IoMdAddCircleOutline} opacity={0.5} />
              <Text fontSize="14px" fontWeight={500} ml={3}>
                Create Incident
              </Text>
            </HoverStyle>
          </Flex>
        ) : (
          <Flex alignItems="center" ml="12px">
            <a
              href="/settings/integrations/pagerduty"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HoverStyle>
                <Box as={VscDebugDisconnect} opacity={0.5} />
                <Text fontSize="14px" fontWeight={500} ml={3}>
                  Connect
                </Text>
              </HoverStyle>
            </a>
          </Flex>
        )}
      </ActionBarItem>
      {hasWebhookIntegration && (
        <ActionBarItem label="Webhook" colorMode={colorMode}>
          {isTicketLoading || loading.WEBHOOK ? (
            <Flex alignItems="center" ml="12px">
              <Spinner size="xs" my={3} ml={2} />
            </Flex>
          ) : (
            <StyledButton
              onClick={() => handleClick('WEBHOOK')}
              colorMode={colorMode}
              ml="16px"
            >
              Trigger Event
            </StyledButton>
          )}
        </ActionBarItem>
      )}
    </Box>
  ) : (
    <Flex my={10} ml={32}>
      <Spinner size="md" />
    </Flex>
  );
};

const IssueMute: React.FC<{ issue: Issue }> = ({ issue }) => {
  const [muteMutate] = useMuteIssueMutation(issue.id);
  const [unmuteMutate] = useUnmuteIssueMutation(issue.id);

  const handleIssueMute = () => {
    if (issue.muted) {
      unmuteMutate({ issues: [issue.id] });
    } else {
      muteMutate({ issues: [issue.id] });
    }
  };
  return (
    <>
      <Switch size="sm" isChecked={issue.muted} onChange={handleIssueMute} />
      <Text fontSize="13px" ml={3}>
        {issue.muted ? 'Issue muted' : 'Issue not muted'}
      </Text>
    </>
  );
};

type FormData = {
  format: string;
};

const ExportIssue: React.FC<{
  issueId: string;
  colorMode: string;
}> = ({ issueId, colorMode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleSubmit, register, formState } = useForm<FormData>();
  const { addToast } = useToasts();

  const onExport = async ({ format }: FormData) => {
    try {
      await API.post(
        `/issues/export`,
        {
          issues: [issueId],
          format
        },
        { ...(format === 'pdf' && { responseType: 'blob' }) }
      );
      onClose();
      addToast('The report will be emailed to you in 10-15 mins.', {
        appearance: 'success'
      });
    } catch (e) {
      console.log(e);
    }
    onClose();
  };
  return (
    <>
      <Button
        data-tour="export"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        onClick={onOpen}
      >
        <IconContext.Provider
          value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
        >
          <Box as={AiOutlineExport} mr={2} fontSize="14px" />
        </IconContext.Provider>
        Export
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          key="modal"
          initial={{
            opacity: 0.9,
            scale: 0.98,
            perspective: '0px',
            perspectiveOrigin: '50% 249.32px'
          }}
          animate={{ scale: 1.05, opacity: 1, perspective: '110px' }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          <ModalHeader
            mb={2}
            borderBottomWidth="1px"
            borderBottomColor={`border.${colorMode}`}
          >
            Export Issue
          </ModalHeader>
          <form onSubmit={handleSubmit(onExport)}>
            <ModalBody>
              <Box minH="70px" width="100%">
                <Flex
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={4}
                >
                  <Text color={`label.${colorMode}`} fontWeight={500}>
                    Format
                  </Text>
                  <Select
                    size="sm"
                    name="format"
                    defaultValue="csv"
                    width="150px"
                    ref={register}
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </Select>
                </Flex>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                variantColor="primary"
                mr={3}
                size="sm"
                type="submit"
                isLoading={formState.isSubmitting}
              >
                Export
              </Button>
              <Button size="sm" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

const ResolveIssue: React.FC<{
  issueId: string;
  colorMode: string;
  status: string;
}> = ({ issueId, colorMode, status }) => {
  const queryCache = useQueryCache();
  const [isOpen, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);

  const resolveIssue = async () => {
    await API.put(`/issues/resolve`, {
      issues: [issueId]
    });
  };
  const [mutate, { isLoading }] = useMutation(resolveIssue, {
    onSuccess: async () => {
      // queryCache.invalidateQueries(['issues']);
      queryCache.invalidateQueries(['issue', issueId]);
      queryCache.invalidateQueries(['actionTrail', issueId]);
    }
  });
  return (
    <>
      <Button
        data-tour="resolve"
        variant="outline"
        size="xs"
        borderWidth="1.7px"
        borderStyle="solid"
        borderColor={colorMode === 'light' ? '#DFE1E4' : '#3D3F44'}
        borderRadius="5px"
        pl="13px"
        pr="17px"
        py="13px"
        fontSize="12px"
        color={colorMode === 'light' ? '#3C4149' : '#D6D7DA'}
        transition="0.2s border, 0.2s color"
        fontWeight={500}
        _hover={{
          borderColor: colorMode === 'light' ? '#C9CBCD' : '#46484E'
        }}
        isDisabled={status !== 'OPEN'}
        onClick={() => setOpen(true)}
      >
        {isLoading ? (
          <>
            <Spinner size="xs" mr={2} /> Resolving...
          </>
        ) : (
          <>
            <IconContext.Provider
              value={{ color: colorMode === 'light' ? '#3C4149' : '#D6D7DA' }}
            >
              <Box as={AiOutlineCheck} mr={2} fontSize="16px" />
            </IconContext.Provider>
            {status === 'OPEN' ? 'Resolve' : 'Resolved'}
          </>
        )}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        headerText="Resolve Issues"
        bodyText="Are you sure you want to mark this issue as resolved?"
        actionButtonColor="green"
        actionButtonText="Resolve"
        onConfirm={() => {
          mutate();
          setOpen(false);
        }}
      />
    </>
  );
};

const PinIssue: React.FC<{
  issue: Issue;
  colorMode: string;
  isIssueLoading: boolean;
}> = ({ issue, colorMode, isIssueLoading }) => {
  const queryCache = useQueryCache();
  const pinIssue = async () => {
    await API.put(`/issues/pin`, {
      issues: [issue.id]
    });
  };
  const unpinIssue = async () => {
    await API.put(`/issues/unpin`, {
      issues: [issue.id]
    });
  };
  const [pinMutate, { isLoading: isPinLoading }] = useMutation(pinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  const [unpinMutate, { isLoading: isUnpinLoading }] = useMutation(unpinIssue, {
    onSuccess: async () => {
      await queryCache.invalidateQueries(['issue', issue.id]);
      await queryCache.invalidateQueries(['pinnedIssues']);
    }
  });
  return (
    <Tooltip label="Pin Issue" aria-label="Pin Issue">
      <Box width="40px" mr={1} data-tour="pin">
        {(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <BgHoverStyle colorMode={colorMode} variant="bg">
            <Spinner size="sm" my="1px" />
          </BgHoverStyle>
        )}
        {!(isPinLoading || isUnpinLoading || isIssueLoading) && (
          <Box onClick={() => (issue.pinned ? unpinMutate() : pinMutate())}>
            <BgHoverStyle colorMode={colorMode} variant="bg">
              {issue.pinned ? (
                <Box as={AiFillPushpin} fontSize="18px" />
              ) : (
                <Box as={AiOutlinePushpin} fontSize="18px" />
              )}
            </BgHoverStyle>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

const IssuePageSkeleton: React.FC<{
  breadcrumbs: { name?: string; link: string | null }[];
}> = ({ breadcrumbs }) => {
  const { colorMode } = useColorMode();
  const backLink = breadcrumbs[0].link;

  return (
    <Flex width="100%">
      <Box
        width={['100%', '100%', 'calc(100% - 400px)']}
        height="100vh"
        overflowY="scroll"
      >
        <Flex
          p={4}
          alignItems="center"
          width="100%"
          borderBottomWidth="1px"
          borderBottomStyle="solid"
          borderBottomColor={`border.${colorMode}`}
          fontSize="13px"
          color={`subtle.${colorMode}`}
        >
          <Flex alignItems="center">
            <SidebarToggle />
            <Link to={backLink || ''}>
              <PseudoBox
                as={FaAngleLeft}
                fontSize="20px"
                mr={4}
                ml={[2, 0]}
                fontWeight={700}
                cursor="pointer"
                opacity={0.4}
                transition="0.2s opacity"
                _hover={{ opacity: 1 }}
              />
            </Link>
          </Flex>
          <Breadcrumb>
            {breadcrumbs.map(({ name, link }, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <BreadcrumbItem key={index} isCurrentPage={!link}>
                  {link ? (
                    // @ts-ignore
                    <BreadcrumbLink as={Link} to={link}>
                      {name}
                    </BreadcrumbLink>
                  ) : (
                    <Text
                      maxW="500px"
                      overflow="hidden"
                      style={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {name}
                    </Text>
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </Flex>

        <Box pl="52px" mb={4}>
          <Box maxW="600px">
            <Skeleton>
              <Text fontSize={20} fontWeight="500" my={10}>
                Test
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>

            <Skeleton>
              <Text fontSize={10} mt={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
            <Skeleton>
              <Text fontSize={10} my={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </Text>
            </Skeleton>
          </Box>
        </Box>
      </Box>
      <Box
        width={[0, 0, '400px']}
        height="100vh"
        bg={`bg.secondary.${colorMode}`}
        p={[0, 0, 5]}
      />
    </Flex>
  );
};

export default IssuePageLayout;