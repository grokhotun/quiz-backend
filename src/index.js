const express = require('express');
const cors = require('cors');

const PORT = 5080;
const USERNAME = 'test';
const PASSWORD = 'test';
const TOKEN = 'some super random secure token';
const app = express();

const data = [
  {
    id: 1,
    question: 'Как часто вы посещаете наш ресторан?',
    options: ['Option1', 'Option2', 'Option3'],
  },
  {
    id: 2,
    question: 'Что вам больше всего понравилось у нас?',
    options: ['Option1', 'Option2', 'Option3'],
  },
  {
    id: 3,
    question: 'Что вам не понравилось?',
    options: ['Option1', 'Option2', 'Option3'],
  },
  {
    id: 4,
    question: 'Что вы думаете о скорости и качестве обслуживания?',
    options: ['Option1', 'Option2', 'Option3'],
  },
];

const questionsIds = data.map(({ id }) => id);

const routes = express.Router();

const isAuth = (request) => {
  const authorization = request.headers['authorization'];

  if (!authorization) return false;

  const [, token] = authorization.split(':').map((v) => v.trim());

  if (token !== TOKEN) return false;

  return true;
};

routes.get('/api/questions/', (request, response) => {
  if (!isAuth(request))
    return response.status(401).send({ message: 'Не авторизован' });

  return response.json(data);
});

routes.post('/api/answers/', (request, response) => {
  const { answers } = request.body;

  if (!answers) {
    return response.json({
      message: 'Тело запроса обязательно',
      schemaExample: {
        answers: [{ questionId: 'id вопроса', option: 'оценка' }],
      },
    });
  }

  const answeredQuestionsIds = answers.map(({ questionId }) => questionId);
  const allAnswersAreAnswered = questionsIds.every((id) =>
    answeredQuestionsIds.includes(id),
  );

  const amountOfAnswersIsCorrect = answers.length === data.length;

  const [cantProceed, errorType] =
    [
      [!amountOfAnswersIsCorrect, 'AMOUNT_ERROR'],
      [!allAnswersAreAnswered, 'MISSING_ANSWERS_ERROR'],
    ].filter(([condition]) => condition)[0] || [];

  if (cantProceed) {
    const ids = questionsIds.filter((id) => !answeredQuestionsIds.includes(id));

    switch (errorType) {
      case 'AMOUNT_ERROR':
        return response.json({
          message: 'Ответов больше чем вопросов',
        });

      case 'MISSING_ANSWERS_ERROR':
        return response.json({
          message: `Не хватает ответов на вопросы ${ids.join(', ')}`,
        });

      default:
        return response.sendStatus(500);
    }
  }

  return response.json({
    message: 'Ваши ответы приняты',
  });
});

routes.post('/api/login/', (request, response) => {
  const { username, password } = request.body;

  if (username !== USERNAME || password !== PASSWORD)
    return response.status(400).send({
      message: 'Неверно имя пользователя или пароль',
    });

  return response.json({ jwt: TOKEN });
});

app.use(
  cors({
    origin: '*',
  }),
);

app.use(express.json());
app.use(routes);

app.listen(PORT, () => {
  console.log(`The server has been started on port ${PORT}`);
});
