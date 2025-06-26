import { ProviderMeta } from '../types/integrations';

// Provider configuration for all supported POS and back-office systems
export const providers: ProviderMeta[] = [
  {
    id: 'square',
    label: 'Square',
    type: 'cloud',
    connection: 'oauth',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/square.svg',
    description: 'Connect your Square POS system to monitor transactions and events in real-time.',
    pollIntervalSecs: 300,
    supportsWebhooks: true,
    webhookEndpoint: '/api/webhooks/square',
    webhookEvents: ['order.updated', 'payment.updated'],
    docsUrl: 'https://developer.squareup.com/docs',
    steps: [
      {
        id: 'intro',
        title: 'Connect with Square',
        description: 'Link your Square account to enable secure monitoring of transaction data.',
        component: 'IntroStep',
        props: {
          providerName: 'Square',
          benefits: [
            'Real-time transaction monitoring',
            'Automatic fraud detection',
            'Seamless integration with your existing POS'
          ]
        }
      },
      {
        id: 'oauth',
        title: 'Authorize Access',
        description: 'Click the button below to authorize access to your Square account.',
        component: 'OAuthStep',
        props: {
          providerName: 'Square',
          scopes: ['ORDERS_READ', 'PAYMENTS_READ'],
          buttonText: 'Connect with Square'
        }
      },
      {
        id: 'webhook',
        title: 'Configure Webhooks',
        description: 'We\'ve automatically registered for Square webhooks to receive real-time updates.',
        component: 'WebhookStep',
        props: {
          webhookUrl: '/api/webhooks/square',
          events: ['order.updated', 'payment.updated'],
          autoConfigured: true
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Square account is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'clover',
    label: 'Clover',
    type: 'cloud',
    connection: 'oauth',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/clover.svg',
    description: 'Connect your Clover POS system to monitor transactions and inventory changes.',
    pollIntervalSecs: 300,
    supportsWebhooks: true,
    webhookEndpoint: '/api/webhooks/clover',
    webhookEvents: ['orders', 'payments'],
    docsUrl: 'https://docs.clover.com/',
    steps: [
      {
        id: 'intro',
        title: 'Connect with Clover',
        description: 'Link your Clover account to enable secure monitoring of transaction data.',
        component: 'IntroStep',
        props: {
          providerName: 'Clover',
          benefits: [
            'Real-time transaction monitoring',
            'Automatic fraud detection',
            'Seamless integration with your existing POS'
          ]
        }
      },
      {
        id: 'oauth',
        title: 'Authorize Access',
        description: 'Click the button below to authorize access to your Clover account.',
        component: 'OAuthStep',
        props: {
          providerName: 'Clover',
          scopes: ['orders:read', 'payments:read', 'inventory:read'],
          buttonText: 'Connect with Clover'
        }
      },
      {
        id: 'merchant',
        title: 'Select Merchant',
        description: 'Select the merchant account you want to connect.',
        component: 'MerchantSelectStep'
      },
      {
        id: 'webhook',
        title: 'Configure Webhooks',
        description: 'We\'ve automatically registered for Clover webhooks to receive real-time updates.',
        component: 'WebhookStep',
        props: {
          webhookUrl: '/api/webhooks/clover',
          events: ['orders', 'payments'],
          autoConfigured: true
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Clover account is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'lightspeed',
    label: 'Lightspeed',
    type: 'cloud',
    connection: 'oauth',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/lightspeed.svg',
    description: 'Connect your Lightspeed Retail or Restaurant POS to monitor transactions and inventory.',
    pollIntervalSecs: 600,
    supportsWebhooks: false,
    docsUrl: 'https://developers.lightspeedhq.com/',
    steps: [
      {
        id: 'intro',
        title: 'Connect with Lightspeed',
        description: 'Link your Lightspeed account to enable secure monitoring of transaction data.',
        component: 'IntroStep',
        props: {
          providerName: 'Lightspeed',
          benefits: [
            'Transaction monitoring',
            'Inventory change detection',
            'Employee activity tracking'
          ]
        }
      },
      {
        id: 'oauth',
        title: 'Authorize Access',
        description: 'Click the button below to authorize access to your Lightspeed account.',
        component: 'OAuthStep',
        props: {
          providerName: 'Lightspeed',
          scopes: ['employee:read', 'sale:read', 'inventory:read'],
          buttonText: 'Connect with Lightspeed'
        }
      },
      {
        id: 'account',
        title: 'Select Account',
        description: 'Select the Lightspeed account you want to connect.',
        component: 'AccountSelectStep'
      },
      {
        id: 'sync',
        title: 'Configure Sync',
        description: 'Configure how often we should sync data from your Lightspeed account.',
        component: 'SyncConfigStep',
        props: {
          defaultInterval: 600,
          minInterval: 300,
          maxInterval: 3600
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Lightspeed account is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'toast',
    label: 'Toast',
    type: 'cloud',
    connection: 'oauth',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/toastui.svg',
    description: 'Connect your Toast POS system to monitor restaurant transactions and employee activity.',
    pollIntervalSecs: 300,
    supportsWebhooks: true,
    webhookEndpoint: '/api/webhooks/toast',
    webhookEvents: ['order.created', 'order.updated', 'payment.processed'],
    docsUrl: 'https://developer.toasttab.com/',
    steps: [
      {
        id: 'intro',
        title: 'Connect with Toast',
        description: 'Link your Toast account to enable secure monitoring of transaction data.',
        component: 'IntroStep',
        props: {
          providerName: 'Toast',
          benefits: [
            'Real-time transaction monitoring',
            'Employee activity tracking',
            'Void and refund detection'
          ]
        }
      },
      {
        id: 'oauth',
        title: 'Authorize Access',
        description: 'Click the button below to authorize access to your Toast account.',
        component: 'OAuthStep',
        props: {
          providerName: 'Toast',
          scopes: ['orders:read', 'payments:read', 'employees:read'],
          buttonText: 'Connect with Toast'
        }
      },
      {
        id: 'restaurant',
        title: 'Select Restaurant',
        description: 'Select the restaurant you want to connect.',
        component: 'RestaurantSelectStep'
      },
      {
        id: 'webhook',
        title: 'Configure Webhooks',
        description: 'We\'ve automatically registered for Toast webhooks to receive real-time updates.',
        component: 'WebhookStep',
        props: {
          webhookUrl: '/api/webhooks/toast',
          events: ['order.created', 'order.updated', 'payment.processed'],
          autoConfigured: true
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Toast account is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'ruby2',
    label: 'Verifone Ruby 2',
    type: 'local',
    connection: 'xml',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/verifone.svg',
    description: 'Connect your Verifone Ruby 2 POS system using our secure local connector.',
    pollIntervalSecs: 300,
    supportsWebhooks: false,
    docsUrl: 'https://www.verifone.com/en/us/devices/multilane/ruby2',
    steps: [
      {
        id: 'intro',
        title: 'Connect Verifone Ruby 2',
        description: 'Connect your Verifone Ruby 2 POS system using our secure local connector.',
        component: 'IntroStep',
        props: {
          providerName: 'Verifone Ruby 2',
          benefits: [
            'Transaction monitoring',
            'Cashier activity tracking',
            'Void and refund detection'
          ],
          localConnector: true
        }
      },
      {
        id: 'download',
        title: 'Download Local Connector',
        description: 'Download and install our secure local connector on your back-office PC.',
        component: 'DownloadStep',
        props: {
          downloadUrl: '/downloads/sentinel-local-connector-setup.exe',
          instructions: [
            'Download the installer',
            'Run as administrator',
            'Follow the installation wizard',
            'The connector will start automatically'
          ]
        }
      },
      {
        id: 'credentials',
        title: 'Enter Commander Credentials',
        description: 'Enter your Ruby Commander credentials to connect to your POS system.',
        component: 'CredentialsStep',
        props: {
          fields: [
            { name: 'commander_ip', label: 'Commander IP Address', type: 'text', placeholder: '192.168.1.50', required: true },
            { name: 'username', label: 'Username', type: 'text', placeholder: 'backoffice', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'site_id', label: 'Site ID', type: 'text', placeholder: 'STORE001', required: true }
          ]
        }
      },
      {
        id: 'test',
        title: 'Test Connection',
        description: 'Testing connection to your Ruby 2 POS system.',
        component: 'TestConnectionStep'
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Verifone Ruby 2 POS system is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'passport',
    label: 'Gilbarco Passport',
    type: 'local',
    connection: 'xml',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gilbarco.svg',
    description: 'Connect your Gilbarco Passport POS system using our secure local connector.',
    pollIntervalSecs: 300,
    supportsWebhooks: false,
    docsUrl: 'https://www.gilbarco.com/us/learning-center/c-store/passport-pos-system',
    steps: [
      {
        id: 'intro',
        title: 'Connect Gilbarco Passport',
        description: 'Connect your Gilbarco Passport POS system using our secure local connector.',
        component: 'IntroStep',
        props: {
          providerName: 'Gilbarco Passport',
          benefits: [
            'Transaction monitoring',
            'Cashier activity tracking',
            'Void and refund detection'
          ],
          localConnector: true
        }
      },
      {
        id: 'download',
        title: 'Download Local Connector',
        description: 'Download and install our secure local connector on your back-office PC.',
        component: 'DownloadStep',
        props: {
          downloadUrl: '/downloads/sentinel-local-connector-setup.exe',
          instructions: [
            'Download the installer',
            'Run as administrator',
            'Follow the installation wizard',
            'The connector will start automatically'
          ]
        }
      },
      {
        id: 'credentials',
        title: 'Enter Passport Credentials',
        description: 'Enter your Passport server credentials to connect to your POS system.',
        component: 'CredentialsStep',
        props: {
          fields: [
            { name: 'server_ip', label: 'Server IP Address', type: 'text', placeholder: '192.168.1.50', required: true },
            { name: 'username', label: 'Username', type: 'text', placeholder: 'manager', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'site_id', label: 'Site ID', type: 'text', placeholder: 'STORE001', required: true }
          ]
        }
      },
      {
        id: 'test',
        title: 'Test Connection',
        description: 'Testing connection to your Passport POS system.',
        component: 'TestConnectionStep'
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Gilbarco Passport POS system is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'petrosoft',
    label: 'Petrosoft CStoreOffice',
    type: 'backoffice',
    connection: 'apikey',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/petronas.svg',
    description: 'Connect your Petrosoft CStoreOffice back-office system to monitor inventory and sales data.',
    pollIntervalSecs: 3600,
    supportsWebhooks: false,
    docsUrl: 'https://www.petrosoftinc.com/cstoreoffice/',
    steps: [
      {
        id: 'intro',
        title: 'Connect Petrosoft CStoreOffice',
        description: 'Connect your Petrosoft CStoreOffice back-office system to monitor inventory and sales data.',
        component: 'IntroStep',
        props: {
          providerName: 'Petrosoft CStoreOffice',
          benefits: [
            'Inventory monitoring',
            'Sales data analysis',
            'Reconciliation tracking'
          ]
        }
      },
      {
        id: 'credentials',
        title: 'Enter CStoreOffice Credentials',
        description: 'Enter your Petrosoft CStoreOffice credentials to connect to your back-office system.',
        component: 'CredentialsStep',
        props: {
          fields: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'store_id', label: 'Store ID', type: 'text', required: true },
            { name: 'api_key', label: 'API Key (if available)', type: 'password', required: false }
          ]
        }
      },
      {
        id: 'test',
        title: 'Test Connection',
        description: 'Testing connection to your Petrosoft CStoreOffice system.',
        component: 'TestConnectionStep'
      },
      {
        id: 'sync',
        title: 'Configure Sync',
        description: 'Configure how often we should sync data from your CStoreOffice system.',
        component: 'SyncConfigStep',
        props: {
          defaultInterval: 3600,
          minInterval: 1800,
          maxInterval: 86400
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your Petrosoft CStoreOffice system is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  },
  {
    id: 'pdi',
    label: 'PDI Enterprise',
    type: 'backoffice',
    connection: 'sftp',
    logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/pdi.svg',
    description: 'Connect your PDI Enterprise back-office system to monitor inventory and sales data.',
    pollIntervalSecs: 3600,
    supportsWebhooks: false,
    docsUrl: 'https://www.pdisoftware.com/enterprise/',
    steps: [
      {
        id: 'intro',
        title: 'Connect PDI Enterprise',
        description: 'Connect your PDI Enterprise back-office system to monitor inventory and sales data.',
        component: 'IntroStep',
        props: {
          providerName: 'PDI Enterprise',
          benefits: [
            'Inventory monitoring',
            'Sales data analysis',
            'Reconciliation tracking'
          ]
        }
      },
      {
        id: 'credentials',
        title: 'Enter PDI Enterprise Credentials',
        description: 'Enter your PDI Enterprise credentials to connect to your back-office system.',
        component: 'CredentialsStep',
        props: {
          fields: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'site_id', label: 'Site ID', type: 'text', required: true },
            { name: 'api_key', label: 'API Key (if available)', type: 'password', required: false }
          ]
        }
      },
      {
        id: 'sftp',
        title: 'Configure SFTP Access',
        description: 'Configure SFTP access to retrieve data files from your PDI Enterprise system.',
        component: 'SFTPConfigStep',
        props: {
          fields: [
            { name: 'sftp_host', label: 'SFTP Host', type: 'text', placeholder: 'sftp.yourdomain.com', required: true },
            { name: 'sftp_username', label: 'SFTP Username', type: 'text', required: true },
            { name: 'sftp_password', label: 'SFTP Password', type: 'password', required: true }
          ]
        }
      },
      {
        id: 'test',
        title: 'Test Connection',
        description: 'Testing connection to your PDI Enterprise system.',
        component: 'TestConnectionStep'
      },
      {
        id: 'sync',
        title: 'Configure Sync',
        description: 'Configure how often we should sync data from your PDI Enterprise system.',
        component: 'SyncConfigStep',
        props: {
          defaultInterval: 3600,
          minInterval: 1800,
          maxInterval: 86400
        }
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Your PDI Enterprise system is now connected and ready to use.',
        component: 'CompleteStep'
      }
    ]
  }
];

// Helper function to get provider by ID
export function getProviderById(id: string): ProviderMeta | undefined {
  return providers.find(provider => provider.id === id);
}

// Helper function to get all providers by type
export function getProvidersByType(type: ProviderType): ProviderMeta[] {
  return providers.filter(provider => provider.type === type);
}

// Helper function to get all cloud providers
export function getCloudProviders(): ProviderMeta[] {
  return getProvidersByType('cloud');
}

// Helper function to get all local providers
export function getLocalProviders(): ProviderMeta[] {
  return getProvidersByType('local');
}

// Helper function to get all back-office providers
export function getBackOfficeProviders(): ProviderMeta[] {
  return getProvidersByType('backoffice');
}