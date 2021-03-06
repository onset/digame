Currently using "@sentry/browser" instead of '@sentry/electron' because of bugs long ago, which could be fixed by now. As a result we're only getting errors from the Render process.

The Keyman team runs their own sentry sever and is graciously sharing that wil lameta. (Sentry.com limits retention on free accounts to 30 days).

1. curl -sL https://sentry.io/get-cli/ | bash # may need some other install method on windows

2. Set a LAMTA_SENTRY_AUTH_TOKEN environment variable with a sentry auth token that has permissions org:read, project:read, project:releases

3. run `./make-sentry-release.sh` in a bash shell

Other commands:
`sentry-cli releases files \$VERSION list`
start over with the uploads:
`sentry-cli releases files \$VERSION delete --all`

---

Note about source-map-support, and how it messes this up.

> If you want to rely on Sentry's source map resolution, make sure that your code is not using the source-map-support package, as it overwrites the captured stack trace in a way that makes it impossible for our processors to correctly parse it.

https://github.com/getsentry/sentry-javascript/issues/2929 questions using "source-map-support".

So I removed source-map-support, no change in the frame we're sending.

I investigated [source-map-support](https://github.com/evanw/node-source-map-support)

Normally if I do `yarn build-production-renderer && yarn start` then do the test throw, I get frame of
`{lineno:467 colno: 43411 filename: render-bundle.js}` This is actually correct... it points to the line where the throw happened.

If I add `import "source-map-support/register";` at the top of menu.ts, then I get `{lineno:19 colno: 294 filename: menu.ts}`. Which is what it is supposed to do. However sentry clearly says they cannot handle that.

# older notes

Problem: sentry-cli seems to read AUTH from sentry.properties (which is committed and thus low permissions), rather than the key I give it in
`sentry-cli login`.
