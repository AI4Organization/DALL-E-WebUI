'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  type: ValidationSeverity;
  title: string;
  message: string;
  fix?: string;
  field?: string;
}

interface ValidationDialogProps {
  visible: boolean;
  issues: ValidationIssue[];
  onDismiss: () => void;
  onFix?: (field: string) => void;
}

const severityConfig = {
  error: {
    icon: <ExclamationCircleOutlined />,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  warning: {
    icon: <ExclamationCircleOutlined />,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  info: {
    icon: <InfoCircleOutlined />,
    iconColor: 'text-accent-cyan',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple/30',
  },
};

export function ValidationDialog({ visible, issues, onDismiss, onFix }: ValidationDialogProps): React.ReactElement {
  if (issues.length === 0) {
    return <></>;
  }

  const primaryIssue = issues[0]!; // Safe: we checked length > 0 above
  const config = severityConfig[primaryIssue.type];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
            }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '400px',
              maxWidth: '500px',
              width: '90%',
              zIndex: 2001,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-card-bg)',
                backdropFilter: 'blur(40px)',
                border: `1px solid var(--color-glass-border)`,
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                className={`${config.bgColor} ${config.borderColor}`}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: `1px solid var(--color-glass-border)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div className={`${config.iconColor}`} style={{ fontSize: '1.5rem' }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {primaryIssue.title}
                  </h3>
                </div>
                <button
                  onClick={onDismiss}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-glass-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <CloseCircleOutlined style={{ fontSize: '1rem' }} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem' }}>
                {/* Main message */}
                <p
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {primaryIssue.message}
                </p>

                {/* Fix suggestion */}
                {primaryIssue.fix && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.1 }}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'var(--color-glass-light)',
                      border: `1px solid ${config.borderColor.replace('/30', '/20')}`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <CheckCircleOutlined
                        style={{
                          color: '#22d3d3',
                          fontSize: '1.125rem',
                          marginTop: '0.125rem',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            marginBottom: '0.25rem',
                          }}
                        >
                          How to fix:
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            lineHeight: '1.5',
                          }}
                        >
                          {primaryIssue.fix}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Additional issues (if any) */}
                {issues.length > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Additional Issues ({issues.length - 1})
                    </div>
                    {issues.slice(1).map((issue, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.5rem 0.75rem',
                          marginTop: '0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: 'var(--color-glass-light)',
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: `1px solid var(--color-glass-border)`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                {onFix && primaryIssue.field && (
                  <Button
                    onClick={() => {
                      onFix(primaryIssue.field!);
                      onDismiss();
                    }}
                    style={{
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Fix for Me
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={onDismiss}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                    border: 'none',
                  }}
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function to create validation issues
export const createValidationIssue = (
  type: ValidationSeverity,
  title: string,
  message: string,
  fix?: string,
  field?: string
): ValidationIssue => ({
  type,
  title,
  message,
  fix,
  field,
});
