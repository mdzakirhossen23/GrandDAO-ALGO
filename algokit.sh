python3 -m pip install --user pipx
python3 -m pipx ensurepath
source ~/.bashrc
pipx install git+https://github.com/joe-p/algokit-cli@gitpod
pipx upgrade algokit
pipx install algokit-client-generator
algokit localnet start
