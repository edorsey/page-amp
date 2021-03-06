var _ = require('lodash'),
    State = require('ampersand-state'),
    Collection = require('ampersand-collection'),
    page  = require('page'),
    ViewSwitcher = require('ampersand-view-switcher'),
    initialized = false,
    Router;
    
Router = State.extend({
  
  collections: {
    routers: Collection,
  },
  
  props: {
    el: "object",
    views: { 
      required: true,
      type: "object"
    },
    rootPath: {
      type: "string",
      default: ""
    },
    options: "object",
    page: "function"
  },
  derived: {
    viewSwitcher: {
      deps: ["el"],
      fn: function() {
        return new ViewSwitcher(this.el);
      }
    }
  },
  
  initialize: function(attrs, options) {
    this.options = options;
    this.page = page;
    _.bindAll(this);
    page(this._before);
    this.setupRoutes(this.createRouteFn());
    page(this.render);
    if (options && options.start) {
      this.start();
    }
  },
  
  start: function() {
    if (!initialized) {
      page('*', this.loadView('fourOhFour'), this.render);
      page(this.options);
      intialized = true;
    }
  },

  setupRoutes: function(r) {
    return new Error("Not Implemented");
  },
  
  loadView: function(view) {
    var self = this;
    if (!this.views[view]) return this.notFound;
    return function (context, next) {
      context.view = self.views[view];
      next();
    }
  },
  
  _before: function(context, next) {
    this.rendered = false;
    next();
  },
  
  render: function(context, next) {
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
    var r = function() {
      var args = Array.prototype.slice.call(arguments);
      if (_.isFunction(args[0])) {
        args = ["*"].concat(args);
      }
      args[0] = self.getPath(args[0]);
      page.apply(self, args);
    };
    
    r.enter = function(path) {
      arguments[0] = self.getPath(arguments[0]);
      page.apply(self, arguments);
    }
    
    r.exit = function(path) {
      arguments[0] = self.getPath(arguments[0]);
      page.exit.apply(self, arguments);
    }
    
    r.router = function(path, Router) {
      self.registerRouter(path, Router);
    }
    
    r.base = function(path) {
      page.base(path);
    }
    
    return r;
  },
  
  getPath: function(path) {
    if (!path && !this.rootPath) {
      return '/';
    }
    if (!path) {
      return this.rootPath + '/*';
    }
    if (path.indexOf(this.rootPath) === -1) {
      return this.rootPath + path;
    }
    return path;
  },
  
  registerRouter: function(routes, router) {
    var self = this;
    
    if (_.isString(routes) && router) {
      route = routes;
      routes = {}
      routes[route] = router
    }
    
    _.each(routes, function(Router, route) {
      var options = _.assign({ rootPath: route }, self.options);
      self.routers.push(new Router(options));
    });
    
  },
  
  notFound: function() {
    var err = new Error("404 Not Found");
    console.warn(err);
    return err;
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
