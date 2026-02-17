import type { Express, Request, Response } from "express";

const PWA_BACKEND_URL = 'https://appmyjantes.mytoolsgroup.eu';

async function proxyRequest(req: Request, res: Response, method: string, path: string) {
  try {
    const url = `${PWA_BACKEND_URL}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }
    
    const fetchOptions: RequestInit = {
      method,
      headers,
      redirect: 'follow',
    };
    
    if (method !== 'GET' && method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, fetchOptions);
    
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      const fixedCookies = setCookieHeaders.map(cookie => 
        cookie
          .replace(/;\s*SameSite=\w+/gi, '; SameSite=None')
          .replace(/;\s*Secure/gi, '; Secure')
      );
      if (!fixedCookies.some(c => c.includes('SameSite='))) {
        res.setHeader('Set-Cookie', fixedCookies.map(c => c + '; SameSite=None; Secure'));
      } else {
        res.setHeader('Set-Cookie', fixedCookies);
      }
    } else {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const fixed = setCookie
          .replace(/;\s*SameSite=\w+/gi, '; SameSite=None')
          .replace(/;\s*Secure/gi, '; Secure');
        res.setHeader('Set-Cookie', fixed);
      }
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
      res.setHeader('Content-Type', contentType);
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }
      const buffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(buffer));
    } else {
      const text = await response.text();
      if (contentType && contentType.includes('text/html')) {
        res.status(response.status === 200 ? 404 : response.status).json({ message: 'Endpoint non disponible' });
      } else {
        res.status(response.status).send(text);
      }
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Erreur de connexion au serveur' });
  }
}

export function setupPwaProxy(app: Express) {
  // Auth endpoints
  app.post('/api/login', (req, res) => proxyRequest(req, res, 'POST', '/api/login'));
  app.post('/api/logout', (req, res) => proxyRequest(req, res, 'POST', '/api/logout'));
  app.get('/api/auth/user', (req, res) => proxyRequest(req, res, 'GET', '/api/auth/user'));
  app.post('/api/register', (req, res) => proxyRequest(req, res, 'POST', '/api/register'));
  app.post('/api/auth/register', (req, res) => proxyRequest(req, res, 'POST', '/api/auth/register'));
  app.post('/api/auth/oauth/google', (req, res) => proxyRequest(req, res, 'POST', '/api/auth/oauth/google'));
  app.post('/api/auth/oauth/apple', (req, res) => proxyRequest(req, res, 'POST', '/api/auth/oauth/apple'));
  
  // Client data endpoints
  app.get('/api/quotes', (req, res) => proxyRequest(req, res, 'GET', '/api/quotes'));
  app.get('/api/quotes/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/quotes/${req.params.id}`));
  app.post('/api/quotes', (req, res) => proxyRequest(req, res, 'POST', '/api/quotes'));
  app.patch('/api/quotes/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/quotes/${req.params.id}`));
  
  app.get('/api/invoices', (req, res) => proxyRequest(req, res, 'GET', '/api/invoices'));
  app.get('/api/invoices/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/invoices/${req.params.id}`));
  
  app.get('/api/reservations', (req, res) => proxyRequest(req, res, 'GET', '/api/reservations'));
  app.post('/api/reservations', (req, res) => proxyRequest(req, res, 'POST', '/api/reservations'));
  app.patch('/api/reservations/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/reservations/${req.params.id}`));
  
  app.get('/api/notifications', (req, res) => proxyRequest(req, res, 'GET', '/api/notifications'));
  app.patch('/api/notifications/:id/read', (req, res) => proxyRequest(req, res, 'PATCH', `/api/notifications/${req.params.id}/read`));
  app.patch('/api/notifications/read-all', (req, res) => proxyRequest(req, res, 'PATCH', '/api/notifications/read-all'));
  
  app.get('/api/prestations', (req, res) => proxyRequest(req, res, 'GET', '/api/engagement'));
  app.get('/api/services', (req, res) => proxyRequest(req, res, 'GET', '/api/engagement'));
  
  // PDF endpoints
  app.get('/api/quotes/:id/pdf', (req, res) => proxyRequest(req, res, 'GET', `/api/quotes/${req.params.id}/pdf`));
  app.get('/api/invoices/:id/pdf', (req, res) => proxyRequest(req, res, 'GET', `/api/invoices/${req.params.id}/pdf`));

  // Admin endpoints
  app.get('/api/admin/analytics', (req, res) => {
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    proxyRequest(req, res, 'GET', `/api/admin/analytics${queryString ? '?' + queryString : ''}`);
  });
  
  app.get('/api/admin/quotes', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/quotes'));
  app.post('/api/admin/quotes', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/quotes'));
  app.patch('/api/admin/quotes/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/quotes/${req.params.id}`));
  app.delete('/api/admin/quotes/:id', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/quotes/${req.params.id}`));
  app.post('/api/admin/quotes/:id/generate-invoice', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/quotes/${req.params.id}/generate-invoice`));
  
  app.get('/api/admin/invoices', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/invoices'));
  app.post('/api/admin/invoices', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/invoices'));
  app.patch('/api/admin/invoices/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/invoices/${req.params.id}`));
  app.delete('/api/admin/invoices/:id', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/invoices/${req.params.id}`));
  app.post('/api/admin/invoices/:id/send-email', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/invoices/${req.params.id}/send-email`));
  
  app.get('/api/admin/reservations', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/reservations'));
  app.patch('/api/admin/reservations/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/reservations/${req.params.id}`));
  
  app.get('/api/admin/users', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/users'));
  app.patch('/api/admin/users/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/users/${req.params.id}`));
  
  app.get('/api/admin/garages', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/garages'));
  app.post('/api/admin/garages', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/garages'));
  app.patch('/api/admin/garages/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/garages/${req.params.id}`));
  
  // Services / Prestations admin
  app.post('/api/admin/services', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/services'));
  app.patch('/api/admin/services/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/services/${req.params.id}`));
  app.post('/api/admin/prestations', (req, res) => proxyRequest(req, res, 'POST', '/api/admin/prestations'));
  app.patch('/api/admin/prestations/:id', (req, res) => proxyRequest(req, res, 'PATCH', `/api/admin/prestations/${req.params.id}`));
  
  // Settings
  app.get('/api/admin/settings', (req, res) => proxyRequest(req, res, 'GET', '/api/admin/settings'));
  app.put('/api/admin/settings', (req, res) => proxyRequest(req, res, 'PUT', '/api/admin/settings'));
  
  // Chat/Conversations endpoints
  app.get('/api/conversations', (req, res) => proxyRequest(req, res, 'GET', '/api/conversations'));
  app.post('/api/conversations', (req, res) => proxyRequest(req, res, 'POST', '/api/conversations'));
  app.get('/api/conversations/:id', (req, res) => proxyRequest(req, res, 'GET', `/api/conversations/${req.params.id}`));
  app.get('/api/conversations/:id/messages', (req, res) => proxyRequest(req, res, 'GET', `/api/conversations/${req.params.id}/messages`));
  app.post('/api/conversations/:id/messages', (req, res) => proxyRequest(req, res, 'POST', `/api/conversations/${req.params.id}/messages`));
  
  // Media/Upload endpoints - Quotes
  app.post('/api/uploads/request-url', (req, res) => proxyRequest(req, res, 'POST', '/api/uploads/request-url'));
  app.post('/api/admin/quotes/:id/media', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/quotes/${req.params.id}/media`));
  app.delete('/api/admin/quotes/:id/media/:mediaId', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/quotes/${req.params.id}/media/${req.params.mediaId}`));
  app.get('/api/quotes/:id/media', (req, res) => proxyRequest(req, res, 'GET', `/api/quotes/${req.params.id}/media`));
  
  // Media/Upload endpoints - Invoices
  app.post('/api/admin/invoices/:id/media', (req, res) => proxyRequest(req, res, 'POST', `/api/admin/invoices/${req.params.id}/media`));
  app.delete('/api/admin/invoices/:id/media/:mediaId', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/invoices/${req.params.id}/media/${req.params.mediaId}`));
  app.get('/api/invoices/:id/media', (req, res) => proxyRequest(req, res, 'GET', `/api/invoices/${req.params.id}/media`));
  
  // Password reset endpoints
  app.post('/api/forgot-password', (req, res) => proxyRequest(req, res, 'POST', '/api/forgot-password'));
  app.post('/api/reset-password', (req, res) => proxyRequest(req, res, 'POST', '/api/reset-password'));

  // Delete user account
  app.delete('/api/admin/users/:id', (req, res) => proxyRequest(req, res, 'DELETE', `/api/admin/users/${req.params.id}`));

  // Employee endpoints
  app.get('/api/employee/reservations', (req, res) => proxyRequest(req, res, 'GET', '/api/employee/reservations'));
  app.get('/api/employee/planning', (req, res) => proxyRequest(req, res, 'GET', '/api/employee/planning'));

  // Push notification token registration
  app.post('/api/push-token', (req, res) => proxyRequest(req, res, 'POST', '/api/push-token'));

  // Google Calendar API proxy
  app.post('/api/calendar/events', async (req, res) => {
    try {
      const { accessToken, event } = req.body;
      if (!accessToken || !event) {
        return res.status(400).json({ message: 'Token et événement requis' });
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Calendar API error:', error);
      res.status(500).json({ message: 'Erreur Calendar API' });
    }
  });

  app.get('/api/calendar/events', async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      if (!accessToken) {
        return res.status(401).json({ message: 'Token requis' });
      }

      const timeMin = req.query.timeMin || new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Calendar API error:', error);
      res.status(500).json({ message: 'Erreur Calendar API' });
    }
  });
}
