-- Insert a test notification for the current user
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.',
  'welcome',
  'info',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Welcome to SentinelPOS Guardian! Your security monitoring system is now active.'
  )
ON CONFLICT DO NOTHING;

-- Insert a test warning notification
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Your store has 3 security events that require attention.',
  'alert',
  'warning',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Your store has 3 security events that require attention.'
  )
ON CONFLICT DO NOTHING;

-- Insert a test critical notification
INSERT INTO notifications (user_id, message, type, severity, is_read)
SELECT 
  auth.uid(),
  'Suspicious login attempt detected from unknown location.',
  'security',
  'critical',
  false
WHERE 
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = auth.uid() 
    AND message = 'Suspicious login attempt detected from unknown location.'
  )
ON CONFLICT DO NOTHING;