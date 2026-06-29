# WATonomous Humanoid Documentation

<img width="1148" height="601" alt="image 6" src="https://github.com/user-attachments/assets/b2f1b12b-a0de-4d2c-ba46-6a6f863a65ba" />

Documentation for the WATonomous Humanoid robot project at the University of Waterloo.

## Getting Started

### Setup

1. Create and activate virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Development (with hot reload)

```bash
source .venv/bin/activate
sphinx-autobuild docs docs/_build/html --open-browser
```

This will start a local server at http://127.0.0.1:8000 that automatically rebuilds and refreshes when you make changes.

### Build (one-time)

```bash
source .venv/bin/activate
sphinx-build -b html docs docs/_build/html
python3 -m http.server --directory docs/_build/html 8000
```

<img width="667.75" height="901.75" alt="IMG_0860" src="https://github.com/user-attachments/assets/a0eb0a85-b723-4deb-8ce3-205a1087f7e9" />
<img width="756" height="1008" alt="IMG_0846" src="https://github.com/user-attachments/assets/d4561965-7219-4609-aca3-cb7a7f88d7c7" />
<img width="756" height="1008" alt="IMG_0839" src="https://github.com/user-attachments/assets/2dedaca1-71f3-4fa5-b9f4-8eeaffa435e8" />
<img width="1152" height="625" alt="image 4" src="https://github.com/user-attachments/assets/b3485c33-23b7-4d1b-af03-3ec39ff0171e" />
<img width="732" height="493" alt="image 5" src="https://github.com/user-attachments/assets/deaf55c8-1de4-4761-a11a-47a2c756c50b" />
