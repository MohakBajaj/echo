import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";

tf.enableProdMode();

class NSFWFilter {
  model: nsfwjs.NSFWJS | null = null;
  constructor() {
    this.model = null;
    this.getModel();
  }
  async getModel() {
    try {
      this.model = await nsfwjs.load();
    } catch (error) {
      console.error(error);
    }
  }

  predict(element: HTMLImageElement, guesses: number) {
    if (!this.model) {
      throw new Error("Some error occurred, please try again later!");
    }
    return this.model.classify(element, guesses);
  }

  async predictImg(file: File, guesses = 5) {
    const url = URL.createObjectURL(file);
    try {
      const img = document.createElement("img");
      img.width = 400;
      img.height = 400;

      img.src = url;
      return await new Promise<nsfwjs.PredictionType[]>((res) => {
        img.onload = async () => {
          const results = await this.predict(img, guesses);
          URL.revokeObjectURL(url);
          res(results);
        };
      });
    } catch (error) {
      console.error(error);
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  async isSafe(file: File) {
    try {
      const predictions = await this.predictImg(file, 3);
      const pornPrediction = predictions.find(
        ({ className }) => className === "Porn"
      );
      const hentaiPrediction = predictions.find(
        ({ className }) => className === "Hentai"
      );

      if (!pornPrediction || !hentaiPrediction) {
        return true;
      }
      return !(
        pornPrediction.probability > 0.25 || hentaiPrediction.probability > 0.25
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

const nsfwFilter = new NSFWFilter();

export default nsfwFilter;
