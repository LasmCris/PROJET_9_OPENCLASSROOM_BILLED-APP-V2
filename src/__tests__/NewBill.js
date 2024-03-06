/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom"; // IMPORT DE FIREEVENT
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js"; //IMPORT DE LOCALSTORAGEMOCK
import { ROUTES } from "../constants/routes"; // IMPORT DE ROUTES ET ROUTES_PATH
import mockStore from "../__mocks__/store.js"; // IMPORT DE MOCKSTORE
import router from "../app/Router.js";


window.alert = jest.fn();
jest.mock("../app/Store", () => mockStore);

// Étant donné que je suis connecté en tant qu'employé
describe("Given i am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

  // Quand je suis sur la page NewBill
  describe("When i am on NewBill page", () => {
    // Alors la nouvelle note de frais reste sur l'écran
    test("Then the NewBill form contains the expected input fields", () => {
      // Nouvelle note de frais
      const html = NewBillUI();
      document.body.innerHTML = html;

      const champInputDate = screen.getByTestId("datepicker");
      // Vérifie que l'élément champInputDate est présent dans le DOM et accessible à l'utilisateur
      expect(champInputDate).toBeInTheDocument();

      const champMontantTTC = screen.getByTestId("amount");
      // Vérifie que l'élément champMontantTTC est présent dans le DOM et accessible à l'utilisateur
      expect(champMontantTTC).toBeInTheDocument();

      const champFichierAjoindre = screen.getByTestId("file");
      // Vérifie que l'élément champFichierAjoindre est présent dans le DOM et accessible à l'utilisateur
      expect(champFichierAjoindre).toBeInTheDocument();

      const formulaireNouvelleNoteDeFrais = screen.getByTestId("form-new-bill");
      // Vérifie que le formulaire est bien présent dans le DOM
      expect(formulaireNouvelleNoteDeFrais).toBeTruthy();

      // Création de la fonction pour stopper l'action par défaut
      const envoiNoteDeFrais = jest.fn((e) => e.preventDefault());

      // Écoute l'event du bouton envoie du formulaire avec la fonction envoiNoteDeFrais
      formulaireNouvelleNoteDeFrais.addEventListener("submit", envoiNoteDeFrais);

      // Simule un clic sur le bouton d'envoi du formulaire
      fireEvent.submit(formulaireNouvelleNoteDeFrais);

      // Après le clic, le formulaire doit toujours être visible dans le DOM
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

  });


  // J'ajoute un ficher joint au bon format
  describe("When i download the attached file in the correct format ", () => {

    // Test vérifiant que l'utilisateur ne peut pas sélectionner un fichier qui n'est pas une image
    test("Then I can't select upload a non-image file", () => {
      // Insertion du code HTML du formulaire dans le DOM
      document.body.innerHTML = NewBillUI();

      // Création d'une instance de NewBill avec les paramètres nécessaires
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
        store: null,
      });

      mockStore.create = jest.fn()
  

      // Définition d'une fonction pour gérer l'événement de changement de fichier
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      expect(inputFile).toBeTruthy();

      // Ajout de l'écouteur d'événement pour le changement de fichier
      inputFile.addEventListener("change", handleChangeFile);

      // Création d'un fichier text simulé (non-image)
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["simulation d'un fichier texte"], "file.txt", {
              type: "text/plain",
            }),
          ],
        },
      });



      // Vérification que l'événement de changement de fichier a été appelé, mais que le fichier n'est pas une image
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).not.toBe("file.jpg");
      expect(mockStore.create).not.toHaveBeenCalled();

    });


    // La nouvelle note de frais et envoyé
    test("Then the newbill is sent", () => {
      // Simulation de la page note de frais
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Création d'une nouvelle instance newBill
      const newBill = new NewBill({
        //je crée une nouvelle instance newbill
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      // Création constante pour fonction qui appel la fonction a tester
      const LoadFile = jest.fn((e) => newBill.handleChangeFile(e)); //chargement du fichier

      // Recupération du champ du fichier
      const fichier = screen.getByTestId("file");

      // Condition du test
      const testFormat = new File(["c'est un test"], "test.jpg", {
        type: "image/jpg",
      });

      // Écoute l'event
      fichier.addEventListener("change", LoadFile);

      // Évènement au change en relation avec la condition du test
      fireEvent.change(fichier, { target: { files: [testFormat] } });

      // Je vérifie que le fichier est bien chargé
      expect(LoadFile).toHaveBeenCalled();

      // Je vérifie que le fichier téléchargé est bien conforme à la condition du test
      expect(fichier.files[0]).toStrictEqual(testFormat);

      // Cible le formulaire
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();

      // Simule la fonction
      const sendNewBill = jest.fn((e) => newBill.handleSubmit(e));

      // Évènement au submit
      formNewBill.addEventListener("submit", sendNewBill);

      // Simule l'évènement
      fireEvent.submit(formNewBill);
      expect(sendNewBill).toHaveBeenCalled();

      // Lorsqu'on créer une nouvelle note de frais on verifie s'il est bien redirigé vers la page d'accueil
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    

  });
});
