# Page Amp

Trying to build a reusable router that uses [page.js](https://visionmedia.github.io/page.js/) as a routing engine and adds some nice sugar to make it flexible and modular.

I've not tested this at all (not even loaded it in a browser).

This duplicates the backend Controller pattern that we follow at Freightview and expands upon the concept of middleware on the frontend. I'm using this to experiment with loading models outside of the view/router.
 
Extend the router just like you normally would with Backbone/Ampersand and override `setupRoutes`:

```js

var Router = require('page-amp'),
    views = require('../views'),
    User = require('../models/user'),
    PostRouter = require('./post');
    

var MainRouter = Router.extend({
  setupRoutes: function(r) {
    r("/", this.loadView('root'));
    r("/login", this.loadView('logIn'));
    r(this.authorize);
    r("/me", this.loadUser, this.loadView('profile'));
    r("/user/:id", this.loadUser, this.loadView('profile'));
    r("/logout", this.logOut, this.redirect('/'));
    
    r.router("/post", PostRouter);
    //this.registerRouter("/post", PostRouter) also works, but I like the r. syntax
  },
  authorize: function(context) {
    //Offload to the server to authenticate.
    //This is mostly for JS apps that don't want to use cookies.
    User.loggedIn({
      success: function(user) {
        context.user = user;
        next();
      },
      error: function(state, err) {
        next(err);
      }
    });
  },
  loadUser: function(context, next) {
    //context is passed to the View when render is called.
    if (context.params.id) {
      context.model = new User({ id: context.params.id || context.user.id });
    }
    context.model.fetch({
      success: function() {
        next();
      },
      error: function(state, err) {
        next(err);
      }
    });
    //You could also do the next() down here and listen for "sync" events in your views.

  },
  logOut: function(context, next) {
    context.model.logOut({
     success: function() {
       next();
     },
     error: function(user, err) {
       next(err);
     }
   });
  }
});

var router = new MainRouter({
  views: views, ///a hash table of views that can be available to this Router, matched via passing the hash key to `loadView`
});

window.app.navigate = router.navigate;
window.app.router = router;

```