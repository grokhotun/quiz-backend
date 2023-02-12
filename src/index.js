const express = require('express');
const cors = require('cors');

const PORT = 5080;
const app = express();

const data = [
  { id: 1, question: 'Как часто вы посещаете наш ресторан?' },
  { id: 2, question: 'Что вам больше всего понравилось у нас?' },
  { id: 3, question: 'Что вам не понравилось?' },
  { id: 4, question: 'Что вы думаете о скорости и качестве обслуживания?' },
];

const questionsIds = data.map(({ id }) => id);

const routes = express.Router();

routes.get('/api/questions/', (request, response) => {
  return response.json(data);
});

routes.post('/api/answers/', (request, response) => {
  const { answers } = request.body;

  if (!answers) {
    return response.json({
      message: 'Тело запроса обязательно',
      schemaExample: {
        answers: [{ questionId: 'id вопроса', mark: 'оценка' }],
      },
    });
  }

  const answeredQuestionsIds = answers.map(({ questionId }) => questionId);
  const allAnswersAreAnswered = questionsIds.every((id) =>
    answeredQuestionsIds.includes(id),
  );
  const allMarksAreCorrect = answers.every(
    ({ mark }) => mark >= 1 && mark <= 5,
  );
  const amountOfAnswersIsCorrect = answers.length === data.length;

  const cantProceedReasons = [
    [!amountOfAnswersIsCorrect, 'AMOUNT_ERROR'],
    [!allAnswersAreAnswered, 'MISSING_ANSWERS_ERROR'],
    [!allMarksAreCorrect, 'MARK_ERROR'],
  ];

  const [cantProceed, errorType] =
    cantProceedReasons.filter(([condition]) => condition)[0] || [];

  if (cantProceed) {
    const ids = questionsIds.filter((id) => !answeredQuestionsIds.includes(id));

    const wrongAnswers = answers
      .filter(({ mark }) => mark > 5 || mark < 1)
      .map(({ questionId }) => questionId);

    switch (errorType) {
      case 'AMOUNT_ERROR':
        return response.json({
          message: 'Ответов больше чем вопросов',
        });

      case 'MISSING_ANSWERS_ERROR':
        return response.json({
          message: `Не хватает ответов на вопросы ${ids.join(', ')}`,
        });

      case 'MARK_ERROR':
        return response.json({
          message: `В ответах c id ${wrongAnswers.join(
            ', ',
          )} неверно выставлены оценки. Допустимые значения: 1-5`,
        });

      default:
        return response.sendStatus(500);
    }
  }

  return response.json({
    message: 'Ваши ответы приняты',
  });
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
