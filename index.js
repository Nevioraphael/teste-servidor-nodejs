const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const courses = [
  { id: 1, title: 'Node.js Essencial', description: 'Crie APIs REST com Express e MongoDB', price: 129.90 },
  { id: 2, title: 'React com TypeScript', description: 'SPA modernas com qualidade e tipagem', price: 149.90 },
  { id: 3, title: 'Backend com NestJS', description: 'Arquitetura escalável para microserviços', price: 159.90 }
];

const users = [
  { id: 1, name: 'admin', email: 'admin', password: '123' }
];

const sessions = new Map();

const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization || '';
  const [type, token] = auth.split(' ');
  return type === 'Bearer' ? token : null;
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  req.user = sessions.get(token);
  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const user = users.find((u) =>
    (u.email === usuario || u.name.toLowerCase() === (usuario || '').toLowerCase()) &&
    u.password === senha
  );

  if (!user) {
    return res.status(401).send(`<!doctype html><html><body><script>alert('Usuário ou senha inválidos'); window.location='/login';</script></body></html>`);
  }

  const token = crypto.randomUUID();
  sessions.set(token, { id: user.id, name: user.name, email: user.email });
  res.redirect(`/dashboard?token=${token}`);
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

app.get('/api/courses', (req, res) => {
  res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find((item) => item.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Curso não encontrado' });
  }
  res.json(course);
});

app.post('/api/enroll', (req, res) => {
  const { name, email, courseId } = req.body;
  const course = courses.find((item) => item.id === Number(courseId));

  if (!name || !email || !course) {
    return res.status(400).json({ error: 'Payload inválido, informe name, email e courseId válidos' });
  }

  res.json({ message: `Inscrição realizada com sucesso para ${name} no curso ${course.title}`, courseId, email });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Email ou senha inválido' });
  }

  const token = crypto.randomUUID();
  sessions.set(token, { id: user.id, name: user.name, email: user.email });

  res.json({ message: 'Autenticado com sucesso', token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  const token = getTokenFromHeader(req);
  if (token) sessions.delete(token);
  res.json({ message: 'Logout realizado' });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
