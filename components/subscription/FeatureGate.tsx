// components/subscription/FeatureGate.tsx - Feature access control with upgrade prompts
import React from 'react';
import { useChatStore } from '../../stores/chatStore';

interface FeatureGateProps {
  feature: 'messages' | 'files' | 'export' | 'search';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const { subscription } = useChatStore();

  const hasAccess = () => {
    if (!subscription) return false;

    switch (feature) {
      case 'messages':
        return subscription.usage.maxMessages === -1 || 
               subscription.usage.messagesThisMonth < subscription.usage.maxMessages;
      
      case 'files':
        return subscription.usage.maxFiles === -1 || 
               subscription.usage.filesUploadedThisMonth < subscription.usage.maxFiles;
      
      case 'export':
      case 'search':
        return subscription.plan !== 'free';
      
      default:
        return true;
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return <UpgradePrompt feature={feature} />;
};

// Individual upgrade prompt component
const UpgradePrompt: React.FC<{ feature: string }> = ({ feature }) => {
  const getFeatureMessage = () => {
    switch (feature) {
      case 'messages':
        return 'You\'ve reached your monthly message limit. Upgrade to Pro for unlimited messages.';
      case 'files':
        return 'You\'ve reached your monthly file upload limit. Upgrade to Pro for more uploads.';
      case 'export':
        return 'Export conversations is available in Pro plans.';
      case 'search':
        return 'Message search is available in Pro plans.';
      default:
        return 'This feature requires a Pro subscription.';
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">⭐</div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 mb-2">{getFeatureMessage()}</p>
          <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Usage indicator component
export const UsageIndicator: React.FC = () => {
  const { subscription } = useChatStore();

  if (!subscription || subscription.plan === 'pro_plus') {
    return null;
  }

  const getUsageColor = (used: number, max: number) => {
    if (max === -1) return 'text-green-600';
    const percentage = (used / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatUsage = (used: number, max: number) => {
    if (max === -1) return 'Unlimited';
    return `${used}/${max}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Usage This Month</h3>
      
      <div className="space-y-3">
        {/* Messages Usage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Messages</span>
          <span className={`text-sm font-medium ${getUsageColor(
            subscription.usage.messagesThisMonth, 
            subscription.usage.maxMessages
          )}`}>
            {formatUsage(subscription.usage.messagesThisMonth, subscription.usage.maxMessages)}
          </span>
        </div>

        {/* Messages Progress Bar */}
        {subscription.usage.maxMessages !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                subscription.usage.messagesThisMonth >= subscription.usage.maxMessages * 0.9 
                  ? 'bg-red-500' 
                  : subscription.usage.messagesThisMonth >= subscription.usage.maxMessages * 0.7
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min(
                  (subscription.usage.messagesThisMonth / subscription.usage.maxMessages) * 100, 
                  100
                )}%` 
              }}
            />
          </div>
        )}

        {/* Files Usage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">File Uploads</span>
          <span className={`text-sm font-medium ${getUsageColor(
            subscription.usage.filesUploadedThisMonth, 
            subscription.usage.maxFiles
          )}`}>
            {formatUsage(subscription.usage.filesUploadedThisMonth, subscription.usage.maxFiles)}
          </span>
        </div>

        {/* Files Progress Bar */}
        {subscription.usage.maxFiles !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                subscription.usage.filesUploadedThisMonth >= subscription.usage.maxFiles * 0.9 
                  ? 'bg-red-500' 
                  : subscription.usage.filesUploadedThisMonth >= subscription.usage.maxFiles * 0.7
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min(
                  (subscription.usage.filesUploadedThisMonth / subscription.usage.maxFiles) * 100, 
                  100
                )}%` 
              }}
            />
          </div>
        )}

        {/* Current Plan */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Plan</span>
            <span className="text-sm font-medium text-blue-600 capitalize">
              {subscription.plan.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {subscription.plan === 'free' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            Upgrade to Pro for Unlimited Access
          </button>
        </div>
      )}
    </div>
  );
};

// Plan comparison modal
interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'pro' | 'pro_plus') => void;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        '50 messages per month',
        '5 file uploads per month',
        'Basic chat features',
        'Community support'
      ],
      limitations: [
        'Limited messages',
        'Limited file uploads',
        'No export feature',
        'No message search'
      ],
      current: true
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$4',
      description: 'Unlimited conversations and uploads',
      features: [
        'Unlimited messages',
        '50 file uploads per month',
        'Export conversations',
        'Message search',
        'Priority support',
        'Advanced file analysis'
      ],
      popular: true
    },
    {
      id: 'pro_plus' as const,
      name: 'Pro Plus',
      price: '$8',
      description: 'Everything you need for professional use',
      features: [
        'Everything in Pro',
        'Unlimited file uploads',
        'Advanced AI models',
        'Priority processing',
        'Data export',
        'Custom integrations'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">Upgrade to unlock unlimited access and advanced features</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`
                  relative rounded-lg border-2 p-6 transition-all duration-200
                  ${plan.popular 
                    ? 'border-blue-500 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${plan.current ? 'bg-gray-50' : 'bg-white hover:shadow-md'}
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== '$0' && <span className="text-gray-600">/month</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}

                  {/* Limitations for free plan */}
                  {plan.limitations && (
                    <>
                      <div className="border-t border-gray-200 my-4"></div>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {plan.current ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      onClick={onClose}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                    >
                      Continue with Free
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectPlan(plan.id)}
                      className={`
                        w-full py-2 px-4 rounded-md font-medium transition-colors
                        ${plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        }
                      `}
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All plans include:</p>
            <div className="flex justify-center space-x-6 mt-2">
              <span>✓ Secure data encryption</span>
              <span>✓ 24/7 uptime</span>
              <span>✓ Regular updates</span>
            </div>
            <p className="mt-4 text-xs">
              Cancel anytime. No long-term commitments. Instant upgrades and downgrades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message actions component with subscription gates
interface MessageActionsProps {
  messageId: string;
  content: string;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  className = ''
}) => {
  const { subscription, deleteMessage, retryMessage } = useChatStore();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AdventureOne Chat Message',
        text: content
      });
    } else {
      copyToClipboard(content);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Copy Message */}
      <button
        onClick={() => copyToClipboard(content)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded"
        title="Copy message"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Share Message */}
      <FeatureGate 
        feature="export" 
        showUpgradePrompt={false}
        fallback={
          <button
            disabled
            className="p-1 text-gray-300 cursor-not-allowed rounded"
            title="Share (Pro feature)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        }
      >
        <button
          onClick={handleShare}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Share message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
      </FeatureGate>

      {/* Delete Message */}
      <button
        onClick={() => {
          if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(messageId);
          }
        }}
        className="p-1 text-gray-400 hover:text-red-600 rounded"
        title="Delete message"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};