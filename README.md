# apostolis

Personal web page to write blogs, update projects and hold a CV page

## Development

To start developing the website, first check whether it builds and runs smoothly. From the root folder run:

```bash
hugo server -D
```

This assumes that you have [hugo](https://gohugo.io/getting-started/installing/) installed.

## Windows (choco)

```bash
choco install hugo -confirm
```

## MacOS (brew)

```bash
brew install hugo
```

## Linux (apt)

```bash
sudo apt install hugo
```

## Git users

To make sure you are using the correct user (applying it to my case - please replace 'apostolos-daniel' with your github user):

```bash
git clone git@github.com-apostolos-daniel:Apostolos-Daniel/toli-io-personal-website.git toli_io_personal_website_apostolos-daniel
git config --local -e
```

Add name and email to your local git config:

```bash
[user]
        name = toli
        email = dev@toli.io
```

Some of this was sourced from <https://gist.github.com/Jonalogy/54091c98946cfe4f8cdab2bea79430f9>.
