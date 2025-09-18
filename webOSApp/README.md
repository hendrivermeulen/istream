# iStream
## Test with Browser
```bash
ares-server . --open
```
## Run the App on TV
```bash
ares-launch -H . -d MyTV
```
## Install the App
```bash
 ares-package .; ares-install --device MyTV .\com.hen3.istream_0.0.0_all.ip
```
### Remove the App
```bash
ares-install --device MyTV -remove com.hen3.istream
```