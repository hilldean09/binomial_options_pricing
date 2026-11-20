# Binomial Options Pricing

A binomial options pricing (Flask) app intended for my personal and general education and the exploration of various binomial options pricing models (e.g. CRR, RB).

# Quickstart

Clone and enter the root of the repository:

```sh
git clone https://github.com/hilldean09/binomial_options_pricing.git
cd binomial_options_pricing
```

Establish the virtual environment (with ```venv```):

```sh
python -m venv .venv
source .venv/bin/activate
```

Install dependencies (```pip```):

```sh
pip install -r requirements.txt
```

Run app:

```sh
python app.py
```

The app will (by default) be accessible via local host (IPv4 address of ```127.0.0.1```) on port 5000 and can be accessed in your browser by pasting ```127.0.0.1:5000``` into the search bar.

The default host and port can be altered via a ```.env``` file in the format:

```
BOP_APP_HOST=[SOME_IP]
BOP_APP_PORT=[SOME_PORT]
```

# Features

The project currently features, for European and American options on non-dividend and dividend paying assets:
- A recursively computed Cox, Ross, Rubinstein (CRR) binomial options pricing model (with associated figures for price, early exercise, delta, and leverage).
- Closed-form CRR pricing model (for non-dividend paying underlying assets).
- Closed-form Black-Scholes (pre-Merton) pricing model and computation of the greeks.
- CRR to Black-Scholes convergence demonstration.

The project also features some smaller educational passages and interactive features:
- A brief explanation of (vanilla) options including an interactive payoff function demonstration.
- Explanations of some prerequisite concepts (risk-free rates and dividends).
- Overview of the CRR binomial options pricing model.

# Media

<img width="1362" height="1310" alt="bop_main_page_european_call" src="https://github.com/user-attachments/assets/be0dfbbb-db74-4e05-b317-97e5405844c3" />
<img width="1333" height="1306" alt="bop_american_put" src="https://github.com/user-attachments/assets/ceea0a52-047e-47d7-9fec-6b8e5c0f2e50" />
<img width="1326" height="1378" alt="bop_european_call_delta_and_leverage" src="https://github.com/user-attachments/assets/8e400946-8f63-4eed-8dbd-0c47af2e7c42" />
<img width="1306" height="1110" alt="bop_american_call_with_dividends" src="https://github.com/user-attachments/assets/65a4e2bd-c3cd-4d4c-abfc-9c84df71de39" />
<img width="1314" height="1217" alt="bop_learn_main_page" src="https://github.com/user-attachments/assets/3c422b57-68d1-4117-8097-2191951777bb" />

# Acknowledgements

I was inspired to conduct this project by a video by Roman Paolucci and the featured project intended for aspiring researchers (https://github.com/romanmichaelpaolucci/Quant-Guild-Library/tree/main/2026%20Video%20Lectures/130.%20Projects%20to%20Help%20you%20Become%20a%20Quant%20(Beginner)/02%20-%20Quant%20Researcher/01%20-%20Intro%20-%20Binomial%20Tree%20Pricer). I have avoided using the associated repository for reference beyond formatting a Flask app and serving Plotly images via JSON. I have not viewed in any depth the functions related to pricing in the repository, instead referencing and reading the CRR paper directly.

I would like to acknowledge the giants whose shoulders I stand atop including the authors of all referenced papers.

Finally, as an Australian citizen, I would like to acknowledge my fortune in being able to study and learn in this country and the original custodians of this land.

# Use of Generative Artificial Intelligence

As the primary purpose of this project is my learning, generative artificial intelligence (GenAI) will not be used for writing any of the core engine or the app script (i.e. the backend). GenAI will be used for frontend components (e.g. HTML template, static scripts). GenAI will not be used to produce any explanatory or educational text, only editing.
