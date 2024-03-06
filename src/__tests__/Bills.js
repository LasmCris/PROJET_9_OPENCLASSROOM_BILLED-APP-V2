/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js"; // ROUTES A IMPORTER
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"; //IMPORT DE LA CLASS BILLS
import mockStore from "../__mocks__/store"; //MOCKSTORE A IMPORTER
import router from "../app/Router.js";


//Jest.mock est fournie par Jest pour remplacer toutes les importations
// du module ../app/Store par ce que renvoi mockStore pour simuler le store
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // La fonction Object.defineProperty, prend 3 argument et
      // permet de redefinir la propriété, localStorage de
      // L'objet window, par un objet qui decrit la nouvelle valeur de la propriété ciblé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      // Utilisation de L'API Local Storage  pour stocker une paire
      // clé-valeur dans le stockage local du navigateur.
      // (localeStorage est une propriété de l'objet Window).
      //  setItem pour simuler un utilisateur de type "Employee".
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");

      root.setAttribute("id", "root");

      document.body.append(root);

      router();

      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    //TEST ASSURRANT QUE LES NOTES DE FRAIS SOIT CLASSE PAR ORDRE CROISSANT
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      // Ma fonction de comparaison
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      // Cette ligne crée une copie du tableau dates avec l'opérateur de spread et
      // apllique la methode sort avec notre fonction de comp
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

//************** */ Test handleClickIconEye containers/Bills.js

// Lorsque je clique sur la premiere icone Oeil
describe("When I click on eye icon", () => {
  // Alors la modal devrair s'ouvrir
  test("Then modal should open", () => {
    // Simule des données dans le localstorage
    Object.defineProperty(window, localStorage, { value: localStorageMock });

    // Simulation d'un utilisateur de type employé dans le locale storage
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);

    router();
    window.onNavigate(ROUTES_PATH.NewBill);

    // Création d'une facture
    const billsContainer = new Bills({
      document,
      onNavigate,
      localStorage: localStorageMock,
      store: null,
    });

    // MOCK de la modal
    $.fn.modal = jest.fn(); // Affichage de la modale

    //MOCK l'icone de click, pour simuler le click
    const handleClickIconEye = jest.fn(() => {
      billsContainer.handleClickIconEye;
    });

    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];

    // Écoute l'événement click sur icon Oeil
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    // Click sur le premier icon Oeil
    fireEvent.click(firstEyeIcon);
    // Vérifie si handleClickIconEye a été appeler
    expect(handleClickIconEye).toHaveBeenCalled();
    // Vérifie si la modal a été appeler
    expect($.fn.modal).toHaveBeenCalled();
  });
});

//***************** */ Test naviagtion containers/Bills.js

// Lorsque je clique sur le bouton nouvelle note de frais
describe("When i click the button 'Nouvelle note de frais'", () => {
  // Alors je rediriger vers NewwBill
  test("So I redirect to NewwBill", () => {
    //J'intègre le chemin d'accès
    router();
    window.onNavigate(ROUTES_PATH.NewBill);

    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });

    // je mock l'appel de la methode handleClickNewBill de l'objet qu'ont vient d'instancier precedemmentt
    const clickNouvelleFacture = jest.fn(billsPage.handleClickNewBill);
    // Je cible le boutton sur lequell ont doit cliquer pour tester
    const btnNewBill = screen.getByTestId("btn-new-bill");

    // Écoute l'event
    btnNewBill.addEventListener("click", clickNouvelleFacture); //écoute évènement
    // Simule un click sur le boutton "Nouvelle note de frais"
    fireEvent.click(btnNewBill);
    // Verification que clickNouvelleFacture a bien été appeler
    expect(clickNouvelleFacture).toHaveBeenCalled();
    // Vérification que je suis bien sur la page "nouvelle note de frais"
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });
});

//******************************** */ Test d'integration getBill

// Quand je demande de récupérer des factures
describe("When I get bills", () => {
  // Alors, ont devrais afficher les factures
  test("Then it should render all the bills", async () => {
    // Recupération des factures dans le store
    const mockedbills = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const getMockedBills = jest.fn(() => mockedbills.getBills());

    const whatWeGet = await getMockedBills();

    // getMockedBills doit être appeler
    expect(getMockedBills).toHaveBeenCalled();
    // Test si la longeur du tableau (le tableau doit contenir les 4 factures du __mocks__ store)
    expect(whatWeGet.length).toBe(4); //test si la longeur du tableau est a 4 du store.js
  });
});

//*********************** TEST ERREUR 404 ET 500

// Quand une erreur se produit sur l'API
describe("When an error occurs on API", () => {
  //Avant chaque test le code suivant sera exécuté
  beforeEach(() => {
    //spyOn` de Jest "espionne" la méthode `bills` de l'objet `mockStore`.
    jest.spyOn(mockStore, "bills");

    //Je mock notre localeStorage avec nos valeur fictif
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    //Je simule un utilisateur de type employé
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );

    //Creation et ajout d'une div root dans notre dom
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

  // Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 404
  test("Then i fetch the invoices in the api and it fails with a 404 error", async () => {
    // pour Mocker un erreur d'API dans notre environement de test
    // On Change le comportement de la méthode `list` de l'objet `bills` du Mockstore
    // En forcant cette methode list a renvoyé une Prommesse REJETE avec
    // cette prommess a pour raison l'instanciation de l'objet ERROR
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.Bills);
    //différer l'exécution d'une fonction
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  // Ensuite, je récupère les factures dans l'api et cela échoue avec une erreur 500
  test("Then i fetch the invoices in the api and it fails with a 500 error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});


