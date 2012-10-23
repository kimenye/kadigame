require 'httparty'
require 'json'
require 'pry'

class ScoreService
  include HTTParty
  base_uri 'https://www.scoreoid.com/api/'

  API_KEY = "c4416a7f3717a7787e6cb7c291b5d6f5977146ab"
  GAME_ID = "ELb9ozqX5"
  TEST_PLAYER_ID = "447396"

  def initialize
    @options = {:api_key => API_KEY, :game_id => GAME_ID, :response => "json" }
  end

  def get_user (username="test")
    opts = { :username => username }
    opts.merge!(@options)

    resp = self.class.post('/getPlayer', { :body => opts })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result[0]["Player"]
    end
  end

  def get_users
    resp = self.class.post('/getPlayers', { :body => @options })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result.collect { |p| p["Player"]}
    end
  end

  def create_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/createPlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def delete_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/deletePlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def is_success(rsp)
    return !is_error(rsp) && rsp.has_key?('success')
  end

  def is_error(rsp)
    return !rsp.kind_of?(Array) && rsp.has_key?('error')
  end
end