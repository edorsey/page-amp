var State = require('ampersand-state'),
    Collection = require('ampersand-collection'),
    page  = require('page'),
    ViewSwitcher = require('ampersand-view-switcher'),
    initialized = false,
    Router;
    
Router = State.extend({

  children: {
    options: State,
  },
  
  collections: {
    routers: Collection,
  }
  
  props: {
    viewSwitcher: "object",
    views: { 
      type: "object"
    },
    rootPath: "string",
    rendered: {
      type: "boolean",
      default: false
    }
  },
  
  initialize: function(attrs, options) {
    this.options = options;
    page(this._before);
    this.setupRoutes(this.getRouteFn());
    page(this.render);
    if (!initialized) {
      page('*', this.loadView('fourOhFour'), this.render);
      page(options);
      intialized = true;
    }
  },

  setupRoutes: function(r) {
    return new Error("Not Implemented");
  },
  
  loadView: function(view) {
    if (!this.views[view]) return this.notFound;
    return function (context, next) {
      context.view = this.views[view];
      next();
    }
  },
  
  _before: function(context, next) {
    this.rendered = false;
    next();
  },
  
  render: function() {
    if (!context.view) return next();
    if (this.rendered) return new Error("Calling rendered multiple times!");
    this.switch(new context.view(context));
    this.rendered = true;
  },
  
  switch: function(view) {
    this.trigger('switch', view);
    this.viewSwitcher.set(view);
    this.trigger('afterSwitch', view);
  },
  
  createRouteFn: function() {
    var self = this;
    var r = function(path) {
      path = this.getPath();
      page.apply(this, arguments);
    };
    
    r.prototype.enter = function(path) {
      arguments[0] = this.getPath(arguments[0]);
      page.apply(this, arguments);
    }
    
    r.prototype.exit = function(path) {
      arguments[0] = this.getPath(arguments[0]);
      page.exit.apply(this, arguments);
    }
    
    r.prototype.getPath = function(path) {
      if (path.indexOf(self.rootPath) === -1) {
        path = self.rootPath + path;
      }
      return path;
    }
    
    r.prototype.router = function(path, Router) {
      self.registerRouter(path, Router);
    }
    
    return r;
  },
  
  registerRouter: function(routes, router) {
    var self = this;
    
    if (_.isString(routes) && router) {
      route = routes;
      routes = {}
      routes[route] = router
    }
    
    _.each(routes, function(Router, route) {
      self.routers.push(new Router({ rootPath: route }));
    });
    
  },
  
  notFound: function() {
    return new Error("404 Not Found");
  },
  
  redirect: function(path) {
    return function(context, next) {
      page.redirect(path);
    }
  },
  
  navigate: function(path) {
    if (!_.isString(path)) return new Error("Navigate path must be a string.");
    page(path);
  }
});
    
module.exports = Router;
