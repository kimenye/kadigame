require 'koala'
require 'pusher'
require 'sprockets'
require 'httparty'
require 'json'

class Kadi < Padrino::Application
  use ActiveRecord::ConnectionAdapters::ConnectionManagement
  register Padrino::Rendering
  register Padrino::Mailer
  register Padrino::Helpers
  register Padrino::Assets

  set :js_compressor, :uglifier
  set :compress_assets, production?

  Pusher.app_id = '26156'
  Pusher.key = '3b40830094bf454823f2'
  Pusher.secret = '4700f33ab2ce0a58b39d'

  helpers do
    def host
      request.env['HTTP_HOST']
    end

    def development?
      return PADRINO_ENV == 'development'
    end

    def production?
      return PADRINO_ENV == 'production'
    end

    def scheme
      request.scheme
    end

    def url_no_scheme(path = '')
      "//#{host}#{path}"
    end

    def url(path = '')
      "#{scheme}://#{host}#{path}"
    end

    def authenticator
      @authenticator ||= Koala::Facebook::OAuth.new(ENV["FACEBOOK_APP_ID"], ENV["FACEBOOK_SECRET"], url("/auth/facebook/callback"))
    end

    def is_logged_in?
      return !session[:player].nil?
    end

    def get_logged_in_user(redirect_to='/')
      @graph  = Koala::Facebook::API.new(session[:access_token])
      @token = session[:access_token]
      begin
        @user = @graph.get_object("me")
        fb_id = @user['id']
        name = @user['name']
        @player = Player.find_by_fb_id(fb_id)
        @app_friends = @graph.fql_query("SELECT uid FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1")
        @friends_using_app = @app_friends.collect { |f| Player.find_by_fb_id(f['id']) }

        if @player.nil?
          @player = Player.new({:fb_id => fb_id, :name => name, :times_played => 0, :games_won => 0})
          @player.save
        end
        session[:player] = @player
        session[:friends_with_app] = @friends_using_app
      rescue Koala::Facebook::APIError
        session[:access_token] = nil
        session[:redirect_to] = redirect_to
        redirect "/auth/facebook"
      end
    end
  end

  post '/stats', :provides => [:json] do
    @player = Player.find_by_fb_id(params[:fb_id])
    stat = GameStats.new({:player_id => @player.id, :start_time => params[:start_time], :end_time => params[:end_time], :elimination => params[:elimination], :one_card => params[:one_card], :pick_top_card => params[:pick_top_card] })
    stat.save!
    status 200
    body({:success => true}.to_json)
  end

  post '/record_times_played', :provides => [:json] do
    @player = Player.find_by_fb_id(params[:fb_id])
    @player.times_played += 1
    @player.save!
    result = true
    if result == true
      status 200
      body({:success => true}.to_json)
    else
      status 500
      body({:success => false}.to_json)
    end
    
  end
  
  post '/record_win', :provides => [:json] do
    @player = Player.find_by_fb_id(params[:fb_id])
    @player = session[:player]
    @player.games_won += 1
    @player.save!
    result_win = result_score = true
    if result_score == true && result_win == true
      status 200
      body({:success => true}.to_json)
    else
      status 500
      body({:success => false}.to_json)
    end
  end

  get :index do
    render :index, :layout => :home
  end
  
  get :version do
    status 200
    body({
            :version => "1.0"
          }.to_json)
  end

  get :social, :provides => [:json]  do
    result = { :success => false }
    #if !session[:player].nil? and !session[:friends_with_app].nil?
    #  friends = session[:friends_with_app].collect { |f|
    #    profile = service.get_user(f.fb_id)
    #    {
    #        :id => f.fb_id,
    #        :name => f.name,
    #        :score => !profile.nil? ? service.calculate_score(f.fb_id) : 0,
    #        :times_played => !profile.nil? ? profile['time_played'].to_i : 0,
    #        :wins => !profile.nil? ? profile['kills'].to_i : 0
    #    }
    #  }
    #  result = { :success => true, :friends => friends }
    #end
    result.to_json
  end

  get :play do
    if development?
      @player = Player.first
      if @player.games_won.nil?
        @player.games_won = 0
      end

      if @player.times_played.nil?
        @player.times_played = 0
      end
      @player.save!
      @friends_using_app = Player.all
      @friends_using_app.reject! { |p| p == @player }

      session[:player] = @player
      session[:friends_with_app] = @friends_using_app
    else
      get_logged_in_user '/play'
    end
    render :play
  end

  post '/mailing-list', :provides => [:json] do
    resp = HTTParty.post('http://www.kadi.co.ke/subscribers', {:body =>  {:email => params[:email] }.to_json })
    result = JSON.parse(resp)['success']
    {:success => result}.to_json
  end

  if development?
    get :jasmine do
      render "jasmine", :layout => :jasminetest
    end
  end

  get '/auth/facebook' do
    session[:access_token] = nil
    redirect authenticator.url_for_oauth_code(:permissions => 'email')
  end

  get '/auth/facebook/callback' do
    if params[:error] == "access_denied"
      flash[:notice] = "<p class='notification'>:-(. Didn't give us permissions. We won't post on your wall without your consent.</p>"
      redirect '/'
    else
      session[:access_token] = authenticator.get_access_token(params[:code])
      if session[:redirect_to].nil?
        redirect '/'
      else
        redirect session[:redirect_to]
      end
    end
  end

  post "/pusher/presence/auth", :provides => [:json] do
    puts "Authenticating presence channel: #{params}"
    response = Pusher[params[:channel_name]].authenticate(params[:socket_id], {
        :user_id => params[:userid],
        :user_info => {
            :name => params[:name]
        }
    })
    response.to_json
  end

  get :logout do
    session[:access_token] = nil
    redirect '/'
  end

  ##
  # Caching support
  #
  # register Padrino::Cache
  # enable :caching
  #
  # You can customize caching store engines:
  #
  #   set :cache, Padrino::Cache::Store::Memcache.new(::Memcached.new('127.0.0.1:11211', :exception_retry_limit => 1))
  #   set :cache, Padrino::Cache::Store::Memcache.new(::Dalli::Client.new('127.0.0.1:11211', :exception_retry_limit => 1))
  #   set :cache, Padrino::Cache::Store::Redis.new(::Redis.new(:host => '127.0.0.1', :port => 6379, :db => 0))
  #   set :cache, Padrino::Cache::Store::Memory.new(50)
  #   set :cache, Padrino::Cache::Store::File.new(Padrino.root('tmp', app_name.to_s, 'cache')) # default choice
  #

  ##
  # Application configuration options
  #
  #set :raise_errors, true       # Raise exceptions (will stop application) (default for test)
  # set :dump_errors, true        # Exception backtraces are written to STDERR (default for production/development)
  # set :show_exceptions, true    # Shows a stack trace in browser (default for development)
  # set :logging, true            # Logging in STDOUT for development and file for production (default only for development)
  # set :public_folder, "foo/bar" # Location for static assets (default root/public)
  # set :reload, false            # Reload application files (default in development)
  # set :default_builder, "foo"   # Set a custom form builder (default 'StandardFormBuilder')
  # set :locale_path, "bar"       # Set path for I18n translations (default your_app/locales)
  # disable :sessions             # Disabled sessions by default (enable if needed)
  # disable :flash                # Disables sinatra-flash (enabled by default if Sinatra::Flash is defined)
  # layout  :my_layout            # Layout can be in views/layouts/foo.ext or views/foo.ext (default :application)
  #

  ##
  # You can configure for a specified environment like:
  #
  #   configure :development do
  #     set :foo, :bar
  #     disable :asset_stamp # no asset timestamping for dev
  #   end
  #

  ##
  # You can manage errors like:
  #
  #   error 404 do
  #     render 'errors/404'
  #   end
  #
  #   error 505 do
  #     render 'errors/505'
  #   end
  #
end
