// //////////////////////////////////////////////////////////////////////////////
// HTML : fonctions génération de HTML à partir des données passées en paramètre
// //////////////////////////////////////////////////////////////////////////////

const htmlQuizzesList = (quizzes, curr, total) => {
  console.debug(`@htmlQuizzesList(.., ${curr}, ${total})`);

  const quizzesLIst = quizzes.map(
    (q) =>
      `<li class="collection-item modal-trigger cyan lighten-5" data-target="id-modal-quizz-menu" data-quizzid="${q.quiz_id}">
        <h5 class="text">${q.title}</h5>
        <span class="text">${q.description} </span> <a class="chip">${q.owner_id}</a>
      </li>`
  );

// //////////////////////////////////////////////////////////////////////////////
// Pagination
// //////////////////////////////////////////////////////////////////////////////

  // le bouton "<" pour aller à la page precedente, ou rien si c'est la premiere page
  const prevBtn =
  `<li class="waves-effect" id="id-prev-quizzes" data-page="${curr-1}">
  <a href="#!"><i class="material-icons">chevron_left</i></a></li>`;

  // le bouton ">" pour aller à la page suivante, ou rien si c'est la derniere page
  const nextBtn =
  curr !== total
  ? `<li class="waves-effect" id="id-next-quizzes" data-page="${curr+1}">
    <a href="#!"><i class="material-icons">chevron_right</i></a></li>`
  : '';

  // Creation des numeros de pages correspondants au nombre total de pages
  let numPages = ""

  for(let i=1; i<=total; i++)
    numPages += `<li class="waves-effect numero-page" id="page${i}" data-page="${i}"><a href="#!">${i}</a></li>`;

  // Le Html qui appel les fonctions au dessus pour affichers les pages et boutons avec les qcm au dessus
  const html = `
  <ul class="collection">
    ${quizzesLIst.join('')}
  </ul>

  <div class="row">
    <ul class="pagination">
      ${prevBtn}
      ${numPages}
      ${nextBtn}
    </ul>
  </div>`;

  return html;
};

// Html des Qcm dans Mes Quiz
const userQuizz = (quizzes) => {
  const quizzesLIst = quizzes.map(
    (q) =>
      `<li class="collection-item modal-trigger cyan lighten-5" data-target="id-modal-quizz-menu" data-quizzid="${q.quiz_id}">
        <h5>${q.title}</h5>
        ${q.description} <a class="chip">${q.owner_id}</a>
      </li>`
  );
  const html = `
  <ul class="collection">
    ${quizzesLIst.join('')}
  </ul>
  `;
  return html;
};

// //////////////////////////////////////////////////////////////////////////////
// RENDUS : mise en place du HTML dans le DOM et association des événemets
// //////////////////////////////////////////////////////////////////////////////

function renderQuizzes()
{
  console.debug(`@renderQuizzes()`);

  // les éléments à mettre à jour : le conteneur pour la liste des quizz
  const usersElt = document.getElementById('id-all-quizzes-list');
  // une fenêtre modale définie dans le HTML
  const modal = document.getElementById('id-modal-quizz-menu');

  // on appelle la fonction de généraion et on met le HTML produit dans le DOM
  usersElt.innerHTML = htmlQuizzesList(
    state.quizzes.results,
    state.quizzes.currentPage,
    state.quizzes.nbPages

  );

  const userQues = document.getElementById('id-my-quizzes-list');  // Question utiliasteur
  userQues.innerHTML = userQuizz(state.myQuizz);

  const userAns = document.getElementById('id-my-answers-list');  // Reponses utilisateur
  userAns.innerHTML = userQuizz(state.myAnswer);

  // /!\ il faut que l'affectation usersElt.innerHTML = ... ait eu lieu pour
  // /!\ que prevBtn, nextBtn et quizzes en soient pas null
  // les éléments à mettre à jour : les boutons
  const prevBtn = document.getElementById('id-prev-quizzes');
  const page = document.getElementsByClassName('numero-page');
  const nextBtn = document.getElementById('id-next-quizzes');
  // Sert a obtenir la page sur laquel on est
  const activePage = document.getElementById(`page${state.quizzes.currentPage}`);
  // la liste de tous les quizzes individuels
  const container = document.querySelector("#id-all-quizzes-list");
  const quizzes = container.querySelectorAll("ul.collection > li");


  // les handlers quand on clique sur "<" ou ">"
  function clickBtnPager()
  {
    // remet à jour les données de state en demandant la page
    // identifiée dans l'attribut data-page
    // noter ici le 'this' QUI FAIT AUTOMATIQUEMENT REFERENCE
    // A L'ELEMENT AUQUEL ON ATTACHE CE HANDLER
    getQuizzes(this.dataset.page);
  }

  if (prevBtn) prevBtn.onclick = clickBtnPager;  // Affichage Page Suivant
  if (nextBtn) nextBtn.onclick = clickBtnPager;  // Affichage Page Precedente

  activePage.classList.add('active')             // Affiche Page Active En Rouge

  Array.from(page).map(obj =>
  {
    obj.onclick = clickBtnPager                  // Handler pour chaque numero de page
  })

  function clickQuiz()   // Fonction qui fetch les quiz
  {
    state.currentQuizz = this.dataset.quizzid;
    let urls = [`${state.serverUrl}/quizzes/${state.currentQuizz}`,
                `${state.serverUrl}/quizzes/${state.currentQuizz}/questions`];
    let requests = urls.map(url => fetch(url));
    Promise.all(requests)
      .then(tabDeResponses => Promise.all(tabDeResponses.map(filterHttpResponse)))
      .then((data) => {
        renderCurrentQuizz(data[1]);  // Appel render pour afficher le html du quizz en question
      });

  }

  quizzes.forEach((q) =>
  {
    q.onclick = clickQuiz;  // Appel clickQuiz a chaque click sur un quizz pour l'afficher
  });
}

// //////////////////////////////////////////////////////////////////////////////
// Affichage Questions/Réponses
// //////////////////////////////////////////////////////////////////////////////

// Retourne -1 si l'utilisateur n'a pas répondu à la question, l'indice de la question dans la liste des quizz répondus par l'utilisateur sinon
function AnswerIndice (Quizz)
{
  const id = Quizz[0].quiz_id;                      // L'ID du quizz actuelement selectionné
  const url = `${state.serverUrl}/users/answers`;   // L'URL pour récupérer tous les quizz répondus par l'utilisateur
  return (fetch(url, { method: 'GET', headers: state.headers() })
  .then(filterHttpResponse)
  .then((data) => {
    lID = data.map(tab => tab.quiz_id);  // Tableau représentant les ID des quizz répondus par l'utilisateur
    indice = lID.indexOf(id);            // Retourne l'indice du quizz actuel dans le tableau
    if(indice >=0)                       // Si l'utilisateur a répondu au quizz
      return (data[indice].answers);     // On retourne ses réponses
    else
      return undefined;                  // Sinon on retourne undefined
  }));
}

function renderCurrentQuizz(Quizz)
{
  const main = document.getElementById('id-all-quizzes-main');
  main.innerHTML='';
  Quizz.map(obj =>
  {
    main.innerHTML += `<div id=question${obj.question_id} ><h5 class="text"> ${obj.question_id+1}) ${obj.sentence} </h5>`;
    const ques = document.getElementById('question'+obj.question_id);
    obj.propositions.map((prop) =>
    {
      AnswerIndice(Quizz).then((rep)=>  // Mise à jour des boutons radio en fonction des réponses de l'utilisateur
      {
        const choix = document.getElementById('answ'+obj.question_id+'-'+prop.proposition_id);  // On récupère l'id de la proposition
        if(rep == undefined)    // Si l'utilisateur n'a pas répondu à la question
          choix.checked=false;  // La case est décochée
        else
          choix.checked=rep[obj.question_id].proposition_id === prop.proposition_id;  // Sinon, on coche si la proposition correspond à celle de l'utilisateur
      });

        ques.innerHTML += `<label><input type=radio onclick=sendAnsw(${obj.question_id}) id=answ${obj.question_id}-${prop.proposition_id} value=${prop.proposition_id}
                          name=q${obj.question_id} /> <span class="text"> ${prop.content} </span></label> <br>`;
        document.getElementById('answ'+obj.question_id+'-'+prop.proposition_id).checked=true;
    });
  });
}

// //////////////////////////////////////////////////////////////////////////////
// Envoie Réponses Quizz
// //////////////////////////////////////////////////////////////////////////////

function sendAnsw(numQuestion)
{
  const choix = document.querySelector(`input[name=q${numQuestion}]:checked`).value;
  const info =
  {
    'user_id': state.user.user_id,
    'quiz_id': state.currentQuizz,
    'question_id': numQuestion,
    'proposition_id': choix
  };
  const push = `${state.serverUrl}/quizzes/${state.currentQuizz}/questions/${numQuestion}/answers/${choix}`;
  fetch (push, { method : 'POST', headers: state.headers(),
                 body : JSON.stringify(info) });
}

// //////////////////////////////////////////////////////////////////////////////
// Login
// //////////////////////////////////////////////////////////////////////////////

const renderUserBtn = () =>
{
  getUser();
  const btn = document.getElementById('id-login');
  btn.onclick = () =>
  {
    if (state.user)
    {
      const res = confirm(`Bonjour ${state.user.firstname} ${state.user.lastname.toUpperCase()}, Voulez-vous vous delogger`);
      if (res)
      {
        deconnexion();
      }
    }
    else
    {
      connexion();
    }
  };
};

// //////////////////////////////////////////////////////////////////////////////
// Recherche
// //////////////////////////////////////////////////////////////////////////////

const surbillance = (search) =>
{

  const text = Array.from(document.getElementsByClassName('text'));  // Recupère tous les champs qui sont potentielement à mettre en surbillance
  const surbi = '(<span style="background-color:yellow;">)';         // La balise de surbillance (pour supprimer ce qui a déjà été mis en surbillance avant
  const RegOld = new RegExp(surbi,"gi");  // Reconnaissance des zones en surbillance
  const modif = "("+search+")";           // Le texte à modifier
  const RegNew = new RegExp(modif,"gi");  //Reconnaissance des zones à mettre en surbillance

  for(let i = 0; i<text.length; i++)
  {
    text[i].innerHTML = text[i].innerHTML.replace(RegOld,'');  // Enlève ce qui a déjà été mis en surbillance
    text[i].innerHTML = text[i].innerHTML.replace(RegNew,'<span style="background-color:yellow;">$1</span>');  // Mets les occurences de search en surbillance
  }

}

const tri = () =>
{
  const form = document.getElementById('form-tri');
  form.innerHTML=`
  <p>Trier par : </p>
  <select id="tri">
    <option value="">Id ↗</option>
    <option value="1">Id ↘</option>
    <option value="2">Date ↗</option>
    <option value="3">Date ↘</option>
    <option value="4">Titre ↗</option>
    <option value="5">Titre ↘</option>
    <option value="6">Auteur ↗</option>
    <option value="7">Auteur ↘</option>
  </select>
  <p>Nombre de quizz par page : </p>
  <input id="nbquizz" type="text" value="50"></input>
  <button onclick="getQuizzes()">Valider</button>`;
}
tri();
