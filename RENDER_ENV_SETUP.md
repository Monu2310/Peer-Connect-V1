# 🔥 RENDER ENVIRONMENT VARIABLES SETUP

## ⚠️ CRITICAL: Set these on Render NOW

Go to: https://dashboard.render.com → Your Backend Service → Environment

Add these 3 variables:

### 1. FIREBASE_PROJECT_ID
```
peerconnect-f6a5c
```

### 2. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@peerconnect-f6a5c.iam.gserviceaccount.com
```

### 3. FIREBASE_PRIVATE_KEY
**IMPORTANT:** Paste this with ACTUAL newlines (not \n characters):

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrLYWGP4OpRnKE
KjL4dr/i+IIE7JoAEZmsp6P5oifocwpYSwLaPOWyi3SvC0vdkP1WAENKd107vqHW
f1jYrhGxwc8dysKVU5fAjxnC+UJ8rExxddqdgpUsI2Cme9IhFvn9eWzeQEZP3yxU
q0vH67N+9oPhIiLKekiCDXNUmaIRGF/TC/il260XWpjVmMCQl1GlImTAy/plHrnL
j/W6PJ1BmmKG7Ac8kesG4FvqY0AAc65NlPYh1SRaAPcxZU1DDpaQ10QZkYFSoRma
au9p03yOYuDKPNfc7KgKX5xmG2tPeFUzCjwp8IR73opbn9UYscm4PykLwZwlJKLV
ZgMrrOVvAgMBAAECggEANfkMeN/d66nCwdlsaNtIdZBVrqfLhuoFwmK5WSS/4JMl
V+GO7LD22+0MxYSSTzJALrW2gexRAV2COde9c9Suz5WEcKhV4i+RUa3NOaTOSfEp
yTyXycI6tsgQ2W2BO926xSlcIlex081SdP/tzQOMfSPNQVc6EQ2tfxQuoSYv66N3
QDGgqIrs+KFa1tFrnqNPZ9biXgQL5bR1OXvCbEx8nm5OdiCh8wSahXL9jR28OVQq
np+0J8YtwAvEjw5JalE99KyNB2JzwMpIQNgG850KkeFmXMVTGIVMDZvR5tm2Rs+f
/cjf+m8sAYqlTBcQZ6HQCstScx4XB1JtNHIL569LAQKBgQDlnC9Lc37hmWMLOdXr
oSLOlvz+W5OTsFuXC8ZAZaqJjvbqIQ7iw7X+k1b97PSDVdYepDw0LHxbzs8iAJIu
AoZ2dYTjV99YHuJYCKTOMpCyK6pM9Tzc4L5Axx0lZA9FdgjerWBQWSobwB/RqBtX
iLM3OqygT4+RPcvKqQccTS74MQKBgQC+2hWna+aWhgP/e7ImszWzYbd1y7ghNWbt
dCe3A7XxeAdP6AGDxTD9eQS4rIS5AtFyF6B6gcGSpm5U6HCAkfeFbCoE7rK3e7kY
DahM4MmzgTKUDYu5/vOTIdx8uSg7QCOPVOQgTXckCqcl1ibgF/H9RgeEfiVt2Nvp
CTIy9rvvnwKBgDH2s5/yiPikfRXzRuaYUM+tsW3UFZ/8r2GF8WUP+nUmg/pcqTWV
KuQzwalNx8NQiWBvkp4z0/fSX+ZhQ235pLLgTcN+2p39Unmfn+UywaPTtqI6dz0F
NsE30tLRHDWcQr/Z8GxriqsxOntP3mtE1uK8xNW5ml8bmF4IPADflsnxAoGAJtwA
zLYLnVpsNfjZrUeQB5Y95J42P4zACFk+POVkhmYKFxsGM+5Sq0mYzIFUBNeuDa0B
3+/LmjCJBoDNZ2BRJbmAVMDFYtauOVeOjRi3+PS1d6/KY3Sl469hVYPdzTKiCu0e
BfW/7Ha+0dVo1PgLLaa0oSWOOW+OV0SoE/hpC8ECgYEAxMEFCxzuLzDUrrQWkRKD
jlVzkc8L7QmiGIZ438pH5PHbhqKHupQFjWVVhUnSk2opIiHtBM1Sr/y1W36+YI1U
sJKt3hvYmtqEyopf+C3jcHjY8TnK1ss1QjNI1p944dJu8HazPg3RXKIFHSabWPeO
FOteD2hOq5hrU3kDsv9vRvE=
-----END PRIVATE KEY-----
```

## 📋 STEPS:

1. Open Render Dashboard
2. Click your backend service (peer-connect-api)
3. Click "Environment" in left sidebar
4. Click "Add Environment Variable"
5. Add each of the 3 variables above
6. Click "Save Changes"
7. **RENDER WILL AUTO-RESTART THE SERVICE**

## ✅ VERIFY:

After restart, check logs for:
```
Firebase Admin initialized for project: peerconnect-f6a5c
```

## 🧪 TEST LOCALLY FIRST:

Your local server should already work! Test with:
```bash
cd server
npm run dev
```

Then in another terminal:
```bash
cd client
npm start
```

Try registering/logging in locally first to make sure everything works!
