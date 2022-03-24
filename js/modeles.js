// //////////////////////////////////////////////////////////////////////////////
// LE MODELE, a.k.a, ETAT GLOBAL
// //////////////////////////////////////////////////////////////////////////////

const state = {
  xApiKey: '',
  serverUrl: 'https://lifap5.univ-lyon1.fr',
  quizzes: [],
  myQuizz: [],
  myAnswer: [],
  currentQuizz: undefined,

  headers() {
    const headers = new Headers();
    headers.set('X-API-KEY', this.xApiKey);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  }
};

// //////////////////////////////////////////////////////////////////////////////
// OUTILS génériques
// //////////////////////////////////////////////////////////////////////////////

function filterHttpResponse(response) {
  return response
    .json()
    .then((data) => {
      if (response.status >= 400 && response.status < 600) {
        throw new Error(`${data.name}: ${data.message}`);
      }
      return data;
    })
    .catch((err) => console.error(`Error on json: ${err}`));
}

// //////////////////////////////////////////////////////////////////////////////
// DONNEES DES UTILISATEURS
// //////////////////////////////////////////////////////////////////////////////

function connexion()
{
  state.xApiKey = prompt('Veuillez entrer votre clef API pour vous connecter:');
  getUser();
  getQuizzes();
}

function deconnexion()
{
  state.xApiKey = '';
  getUser();
}

const getUser = () => {
  console.debug(`@getUser()`);
  const url = `${state.serverUrl}/users/whoami`;
  return fetch(url, { method: 'GET', headers: state.headers() })
    .then(filterHttpResponse)
    .then((data) => {
      state.user = data;
    });
};

// //////////////////////////////////////////////////////////////////////////////
// DONNEES DES QUIZZES
// //////////////////////////////////////////////////////////////////////////////
// &limit=30

const getQuizzes = (p = 1) => {
  console.debug(`@getQuizzes(${p})`);
  let tri ='';
  let nbQuizz = document.getElementById('nbquizz').value;  // Le nombre de quizz par
  switch(document.getElementById('tri').selectedIndex)//tri correspond à la requete pour la valeur du selecteur
  {
    case 0:
      tri='&order=quiz_id&dir=asc';
      break;
    case 1:
      tri='&order=quiz_id&dir=desc';
      break;
    case 2:
      tri='&order=created_at&dir=asc';
      break;
    case 3:
      tri='&order=created_at&dir=desc';
      break;
    case 4:
      tri='&order=title&dir=asc';
      break;
    case 5:
      tri='&order=title&dir=desc';
      break;
    case 6:
      tri='&order=owner_id&dir=asc';
      break;
    case 7:
      tri='&order=owner_id&dir=desc';
      break;
  }
  const url = `${state.serverUrl}/quizzes/?page=${p}&limit=${nbQuizz}${tri}`;
  return fetch(url, { method: 'GET', headers: state.headers() })
    .then(filterHttpResponse)
    .then((data) => {
      state.quizzes = data;
      return getUserQuizz();
    });
};

const getUserQuizz = ()  => {
  const url =`${state.serverUrl}/users/quizzes`;
  return fetch(url, { method: 'GET', headers: state.headers() })
    .then(filterHttpResponse)
    .then((data) => {
      state.myQuizz = data;
      return getUserAnswer();
    });
};

const getUserAnswer = () => {
  const url =`${state.serverUrl}/users/answers`;
  return fetch(url, { method: 'GET', headers: state.headers() })
    .then(filterHttpResponse)
    .then((data) => {
      state.myAnswer = data;
      return renderQuizzes();
    });
};

// //////////////////////////////////////////////////////////////////////////////
// AJOUT DES QUIZZES
// //////////////////////////////////////////////////////////////////////////////

function ajouterQuizz()
{
  const add = document.getElementById('newQcm');
  const rep = [];
  add.onsubmit = function(a) {
    a.preventDefault();
    const data = {};
    data.title = document.getElementById('nomQcm').value;
    data.description = document.getElementById('descQcm').value;
    data.question = document.getElementById('Quest').value;
    for (i=0;i<4;i++)
    {
      rep[i] = document.getElementById(`rep${i+1}`).value;
    }
    data.reponses = rep;
    const url = `${state.serverUrl}/quizzes`;
    fetch(url, {method: 'POST', headers: state.headers(),  'Content-type': 'application/json; charset=UTF-8',
          body: JSON.stringify(data)}).then(filterHttpResponse);

    getQuizzes();
  };
}
ajouterQuizz();
